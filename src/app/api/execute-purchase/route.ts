import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  listPravaMandates,
  getPravaMandate,
  chargePravaMandate,
  reportPravaMandateCharge,
  type PravaChargeResult,
  type PravaReportResult,
} from '@/lib/prava-sdk';

/**
 * POST /api/execute-purchase
 *
 * Called by the agent loop when a rule's condition is met (e.g. price drop).
 *
 * Prava flow:
 *   1. Find the active mandate for this customer
 *   2. POST /v1/mandates/{id}/charge  → single-use card credentials
 *   3. Use credentials to "checkout" at the store
 *   4. POST /v1/mandates/{id}/charges/{txnId}/report → settle
 *
 * Docs:
 *   - Charge:  docs.prava.space/api-reference/mandate-charge
 *   - Report:  docs.prava.space/api-reference/report-a-mandate-charge
 */
export async function POST(req: NextRequest) {
  // Hoist outside try so the catch block can reference it
  let chargeResult: PravaChargeResult | null = null;
  let reportResult: PravaReportResult | null = null;
  let mandateId: string | null = null;

  try {
    const body = await req.json();
    const {
      ruleId,
      amount,
      targetItem,
      storeUrl,
      userId = 'usr_sentinel_demo',
    } = body;

    const purchaseAmount = Number(amount);
    if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 },
      );
    }

    const pravaCustomerId =
      process.env.PRAVA_CUSTOMER_ID || 'usr_agentic_commerce_hackathon';

    // ── 1. Find the active mandate ─────────────────────────────────────
    const mandates = await listPravaMandates(pravaCustomerId, true);
    const activeMandate = mandates.find(
      (m) => m.status === 'active' || m.state === 'available',
    );

    if (!activeMandate) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No active mandate found. Complete the passkey approval first (Approve with Passkey).',
          mandatesFound: mandates.length,
        },
        { status: 409 },
      );
    }

    mandateId = activeMandate.id;
    console.log(
      `[execute-purchase] Using mandate ${mandateId} (status: ${activeMandate.status}, approved: $${activeMandate.approvedAmount})`,
    );

    // ── 2. Charge the mandate ──────────────────────────────────────────
    // reference = idempotency key; same mandate+reference returns the
    // original charge instead of minting a new one.
    const reference = `rule_${ruleId}_${Date.now()}`;

    chargeResult = await chargePravaMandate(
      mandateId,
      purchaseAmount,
      reference,
    );

    if (chargeResult.status === 'failed') {
      // Over-cap or network decline — report DECLINED and bail
      console.warn(
        `[execute-purchase] Charge failed: ${chargeResult.errorMessage}`,
      );

      try {
        reportResult = await reportPravaMandateCharge(
          mandateId,
          chargeResult.transactionId,
          {
            txnStatus: 'DECLINED',
            amountPaid: '0.00',
            responseCode: '05',
          },
        );
      } catch (reportErr: any) {
        console.warn('[execute-purchase] Report DECLINED failed:', reportErr.message);
      }

      return NextResponse.json(
        {
          success: false,
          error: `Charge declined: ${chargeResult.errorMessage || 'unknown'}`,
          errorCode: chargeResult.errorCode,
          mandateId,
          transactionId: chargeResult.transactionId,
        },
        { status: 402 },
      );
    }

    // ── 3. Extract single-use card credentials ─────────────────────────
    const creds = chargeResult.credentials;
    if (!creds) {
      throw new Error(
        'Prava returned no credentials. fetchStatus: ' +
          chargeResult.fetchStatus,
      );
    }

    console.log(
      `[execute-purchase] Got credentials: token=****${creds.token.slice(-4)}, ` +
        `cvv=${creds.dynamicCvv}, exp=${creds.expiryMonth}/${creds.expiryYear}`,
    );

    // ── 4. Simulate checkout at the store ──────────────────────────────
    // In a real integration you'd POST these credentials to the store's
    // payment endpoint. For the hackathon we simulate a successful checkout.
    const checkoutResult = {
      success: true,
      store: storeUrl || 'https://mock-store.demo',
      item: targetItem || 'Unknown item',
      amountCharged: purchaseAmount.toFixed(2),
      cardUsed: `****${creds.token.slice(-4)}`,
      transactionId: chargeResult.transactionId,
      orderId: chargeResult.orderId,
    };

    // ── 5. Report APPROVED to Prava ────────────────────────────────────
    // This settles the charge with Visa. For a one_time mandate the
    // mandate moves to "consumed" after this.
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
      `[execute-purchase] Report result: status=${reportResult.status}, ` +
        `visa=${reportResult.visaConfirmation}, mandateStatus=${reportResult.mandateStatus}`,
    );

    // ── 6. Update DB ───────────────────────────────────────────────────
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "PaymentSession"
        SET status = 'COMPLETED',
            metadata = metadata || '${JSON.stringify({
              mandateId,
              transactionId: chargeResult.transactionId,
              orderId: chargeResult.orderId,
              visaConfirmation: reportResult.visaConfirmation,
              cardLast4: creds.token.slice(-4),
            }).replace(/'/g, "''")}'::jsonb,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "pravaTxId" = '${mandateId}'
           OR id = '${mandateId}';
      `);
    } catch (dbErr: any) {
      console.warn('[execute-purchase] DB update skipped:', dbErr.message);
    }

    // ── 7. Audit log ───────────────────────────────────────────────────
    if (ruleId) {
      const logId = `log_${Date.now()}`;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "AuditLog" (id, ruleId, action, timestamp, pravaSessionId, uiIcon)
        VALUES (
          '${logId}',
          '${ruleId}',
          '${`Autonomous purchase executed: ${targetItem} for $${purchaseAmount.toFixed(2)}. Mandate ${mandateId} charged (txn: ${chargeResult.transactionId}). Visa confirmation: ${reportResult.visaConfirmation}.`.replace(/'/g, "''")}',
          CURRENT_TIMESTAMP,
          '${mandateId}',
          'check-circle'
        );
      `);
    }

    // ── 8. Success response ────────────────────────────────────────────
    return NextResponse.json({
      success: true,
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

    // If we got a charge but failed later, try to report DECLINED
    if (chargeResult && chargeResult.transactionId && mandateId && !reportResult) {
      try {
        await reportPravaMandateCharge(mandateId, chargeResult.transactionId, {
          txnStatus: 'DECLINED',
          amountPaid: '0.00',
          responseCode: '99',
        });
        console.log('[execute-purchase] Reported DECLINED after error');
      } catch {
        // best-effort
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Purchase execution failed',
        mandateId,
        transactionId: chargeResult?.transactionId ?? null,
      },
      { status: 500 },
    );
  }
}