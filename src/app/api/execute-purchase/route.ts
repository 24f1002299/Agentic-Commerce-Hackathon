import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  listPravaMandates,
  chargePravaMandate,
  reportPravaMandateCharge,
  type PravaChargeResult,
  type PravaReportResult,
} from '@/lib/prava-sdk';

/**
 * POST /api/execute-purchase
 *
 * Called by:
 *   - monitoring-engine.ts  →  body: { ruleId }          ← ONLY ruleId!
 *   - page.tsx (manual)     →  body: { ruleId }
 *
 * This route looks up everything it needs from the DB.
 *
 * Flow:
 *   1. Look up Rule from DB → get maxBudget, targetItem, userId
 *   2. Set Rule.status → TRIGGERED
 *   3. Find active Prava mandate
 *   4. POST /v1/mandates/{id}/charge → single-use credentials
 *   5. Simulate checkout
 *   6. POST /v1/mandates/{id}/charges/{txnId}/report → settle with Visa
 *   7. Set Rule.status → SUCCESS          ← THIS MAKES THE OVERLAY APPEAR
 *   8. Write audit logs + commerce transaction
 */
export async function POST(req: NextRequest) {
  let chargeResult: PravaChargeResult | null = null;
  let reportResult: PravaReportResult | null = null;
  let mandateId: string | null = null;
  let ruleId: string | null = null;

  try {
    const body = await req.json();
    ruleId = body.ruleId;

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: 'Missing ruleId' },
        { status: 400 },
      );
    }

    // ── 1. Look up the Rule from DB ──────────────────────────────────
    //    The monitoring engine only sends { ruleId }. Everything else
    //    (maxBudget, targetItem, userId) comes from the database.
    const rules = await prisma.$queryRawUnsafe<
      {
        id: string;
        userId: string;
        targetItem: string;
        maxBudget: number;
        status: string;
        naturalLanguageQuery: string;
      }[]
    >(
      `SELECT id, "userId", "targetItem", "maxBudget", status, "naturalLanguageQuery"
       FROM "Rule" WHERE id = $1 LIMIT 1;`,
      ruleId,
    );

    if (!rules || rules.length === 0) {
      return NextResponse.json(
        { success: false, error: `Rule ${ruleId} not found` },
        { status: 404 },
      );
    }

    const rule = rules[0];

    if (rule.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: `Rule is ${rule.status}, not ACTIVE. Only ACTIVE rules can execute purchases.`,
          rule_status: rule.status,
        },
        { status: 409 },
      );
    }

    const purchaseAmount = rule.maxBudget;
    const targetItem = rule.targetItem;

    console.log(
      `[execute-purchase] Rule ${ruleId}: "${targetItem}" — budget $${purchaseAmount}`,
    );

    // ── 2. Set Rule → TRIGGERED ──────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      UPDATE "Rule" SET status = 'TRIGGERED', "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1;
    `, ruleId);

    const logIdTriggered = `log_trig_${Date.now()}_1`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, "ruleId", action, timestamp, "uiIcon")
      VALUES (
        $1, $2,
        'Condition met. Initiating autonomous checkout via Prava mandate.',
        CURRENT_TIMESTAMP,
        'zap'
      );
    `, logIdTriggered, ruleId);

    // ── 3. Find the active Prava mandate ─────────────────────────────
    const pravaCustomerId =
      process.env.PRAVA_CUSTOMER_ID || 'usr_agentic_commerce_hackathon';

    const mandates = await listPravaMandates(pravaCustomerId, true);
    const activeMandate = mandates.find(
      (m) => m.status === 'active' || m.state === 'available',
    );

    if (!activeMandate) {
      // Revert rule to ACTIVE so it can retry on the next polling cycle
      await prisma.$executeRawUnsafe(`
        UPDATE "Rule" SET status = 'ACTIVE', "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $1;
      `, ruleId);

      return NextResponse.json(
        {
          success: false,
          error: 'No active Prava mandate found. Complete passkey approval first.',
          rule_status: 'ACTIVE',
          mandatesFound: mandates.length,
        },
        { status: 409 },
      );
    }

    mandateId = activeMandate.id;
    console.log(
      `[execute-purchase] Using mandate ${mandateId} (approved: $${activeMandate.approvedAmount})`,
    );

    // ── 4. Charge the mandate ────────────────────────────────────────
    const reference = `rule_${ruleId}_${Date.now()}`;

    chargeResult = await chargePravaMandate(
      mandateId,
      purchaseAmount,
      reference,
    );

    if (chargeResult.status === 'failed') {
      console.warn(`[execute-purchase] Charge failed: ${chargeResult.errorMessage}`);

      try {
        await reportPravaMandateCharge(mandateId, chargeResult.transactionId, {
          txnStatus: 'DECLINED',
          amountPaid: '0.00',
          responseCode: '05',
        });
      } catch (e: any) {
        console.warn('[execute-purchase] Report DECLINED failed:', e.message);
      }

      await prisma.$executeRawUnsafe(`
        UPDATE "Rule" SET status = 'FAILED', "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $1;
      `, ruleId);

      return NextResponse.json(
        {
          success: false,
          error: `Charge declined: ${chargeResult.errorMessage || 'unknown'}`,
          rule_status: 'FAILED',
          mandateId,
          transactionId: chargeResult.transactionId,
        },
        { status: 402 },
      );
    }

    // ── 5. Extract single-use card credentials ───────────────────────
    const creds = chargeResult.credentials;
    if (!creds) {
      throw new Error('Prava returned no credentials. fetchStatus: ' + chargeResult.fetchStatus);
    }

    console.log(
      `[execute-purchase] Credentials: ****${creds.token.slice(-4)}, exp=${creds.expiryMonth}/${creds.expiryYear}`,
    );

    // Audit log: Prava session charged
    const logIdSession = `log_trig_${Date.now()}_2`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, "ruleId", action, timestamp, "pravaSessionId", "uiIcon")
      VALUES (
        $1, $2,
        $3,
        CURRENT_TIMESTAMP,
        $4,
        'credit-card'
      );
    `,
      logIdSession,
      ruleId,
      `Prava mandate charged. Single-use card credentials generated (****${creds.token.slice(-4)}).`,
      mandateId,
    );

    // ── 6. Simulate checkout at the store ────────────────────────────
    const checkoutResult = {
      success: true,
      item: targetItem,
      amountCharged: purchaseAmount.toFixed(2),
      cardUsed: `****${creds.token.slice(-4)}`,
      transactionId: chargeResult.transactionId,
      orderId: chargeResult.orderId,
    };

    // ── 7. Report APPROVED to Prava (settles with Visa) ──────────────
    reportResult = await reportPravaMandateCharge(
      mandateId,
      chargeResult.transactionId,
      {
        txnStatus: 'APPROVED',
        amountPaid: purchaseAmount.toFixed(2),
        authorizationCode: 'OK' + Date.now().toString(36).toUpperCase(),
        responseCode: '00',
      },
    );

    console.log(
      `[execute-purchase] Visa: ${reportResult.visaConfirmation}, mandate: ${reportResult.mandateStatus}`,
    );

    // ── 8. Set Rule → SUCCESS  ← THIS IS WHAT TRIGGERS THE OVERLAY ──
    await prisma.$executeRawUnsafe(`
      UPDATE "Rule" SET status = 'SUCCESS', "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1;
    `, ruleId);

    // Insert commerce transaction
    const txId = `tx_${Date.now()}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "CommerceTransaction" (id, "userId", "itemTitle", amount, status, "txHash", "createdAt")
      VALUES ($1, $2, $3, $4, 'COMPLETED', $5, CURRENT_TIMESTAMP);
    `, txId, rule.userId, targetItem, purchaseAmount, chargeResult.transactionId);

    // Final success audit log (uiIcon = 'check-circle' → used by overlay)
    const logIdSuccess = `log_trig_${Date.now()}_3`;
    const receiptUrl = `https://dashboard.prava.space/orders/${chargeResult.orderId}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, "ruleId", action, timestamp, "pravaSessionId", "receiptUrl", "uiIcon")
      VALUES (
        $1, $2, $3, CURRENT_TIMESTAMP, $4, $5, 'check-circle'
      );
    `,
      logIdSuccess,
      ruleId,
      `Autonomous purchase completed: ${targetItem} for $${purchaseAmount.toFixed(2)}. Mandate ${mandateId} charged (txn: ${chargeResult.transactionId}). Visa: ${reportResult.visaConfirmation}.`,
      mandateId,
      receiptUrl,
    );

    // ── 9. Success response ──────────────────────────────────────────
    return NextResponse.json({
      success: true,
      rule_status: 'SUCCESS',
      purchaseAmount,
      checkout: checkoutResult,
      prava: {
        mandateId,
        transactionId: chargeResult.transactionId,
        orderId: chargeResult.orderId,
        instructionId: chargeResult.instructionId,
        visaConfirmation: reportResult.visaConfirmation,
        mandateStatus: reportResult.mandateStatus,
        deduplicated: chargeResult.deduplicated,
      },
    });
  } catch (error: any) {
    console.error('[execute-purchase] Error:', error);

    // Best-effort: report DECLINED if we charged but crashed later
    if (chargeResult?.transactionId && mandateId && !reportResult) {
      try {
        await reportPravaMandateCharge(mandateId, chargeResult.transactionId, {
          txnStatus: 'DECLINED',
          amountPaid: '0.00',
          responseCode: '99',
        });
      } catch { /* best-effort */ }
    }

    // Set rule to FAILED
    if (ruleId) {
      try {
        await prisma.$executeRawUnsafe(`
          UPDATE "Rule" SET status = 'FAILED', "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $1;
        `, ruleId);
      } catch { /* best-effort */ }
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Purchase execution failed',
        rule_status: 'FAILED',
        mandateId,
        transactionId: chargeResult?.transactionId ?? null,
      },
      { status: 500 },
    );
  }
}