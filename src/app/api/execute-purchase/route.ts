import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePaymentToken, reportPravaStatus } from '@/lib/prava-sdk';
import { getProducts, getDomainMocks } from '@/lib/store-state';

const HARD_CAP = 60.0;

/**
 * POST /api/execute-purchase
 *
 * Autonomous Payment Execution Engine.
 *
 * Flow:
 *  1. Fetch rule and validate it is in ACTIVE or TRIGGERED state.
 *  2. Resolve the current price from the mock storefront / domain checker.
 *  3. Enforce hard budget cap ($60.00) and rule maxBudget check.
 *  4. Call Prava SDK → generatePaymentToken (creates a Prava session and polls
 *     for the single-use mandate-backed credential).
 *  5. Send the token to the mock store checkout or domain registration API.
 *  6. On success → update Rule to SUCCESS, write audit logs, create
 *     CommerceTransaction, and call Prava reportStatus(APPROVED).
 *  7. On any failure → update Rule to FAILED, write failure audit log, call
 *     Prava reportStatus(DECLINED).
 */
export async function POST(req: NextRequest) {
  let ruleId: string | null = null;
  let pravaSessionId: string | null = null;

  try {
    const body = await req.json();
    ruleId = body.ruleId;

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: ruleId' },
        { status: 400 },
      );
    }

    // ── 1. Fetch rule ─────────────────────────────────────────────────────────
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, userId, naturalLanguageQuery, targetItem, maxBudget, status
       FROM "Rule" WHERE id = '${ruleId}' LIMIT 1;`,
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Rule ${ruleId} not found.` },
        { status: 404 },
      );
    }

    const rule = rows[0];

    if (!['ACTIVE', 'TRIGGERED'].includes(rule.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Rule is in state "${rule.status}". Only ACTIVE or TRIGGERED rules can be executed.`,
        },
        { status: 409 },
      );
    }

    // ── 2. Resolve purchase price & target info ───────────────────────────────
    const target = rule.targetItem.toLowerCase().trim();
    const isDomain =
      target.endsWith('.dev') ||
      target.endsWith('.com') ||
      target.endsWith('.io') ||
      target.endsWith('.ai') ||
      target.endsWith('.net') ||
      target.includes('.');

    let purchasePrice: number = rule.maxBudget;
    let productId: string | null = null;
    let matchedDetail = '';

    if (isDomain) {
      // Domain: price is fixed at a nominal $10 registration fee (mock)
      purchasePrice = 10.0;
      matchedDetail = `Domain ${rule.targetItem} is AVAILABLE for registration`;
    } else {
      const products = getProducts();
      const matchedProduct = products.find(
        (p) =>
          p.name.toLowerCase().includes(target) ||
          target.includes(p.name.toLowerCase()) ||
          p.id.toLowerCase().includes(target),
      );

      if (matchedProduct) {
        purchasePrice = matchedProduct.price;
        productId = matchedProduct.id;
        matchedDetail = `${matchedProduct.name} is IN STOCK at $${matchedProduct.price.toFixed(2)} (Budget: $${rule.maxBudget.toFixed(2)})`;
      } else {
        matchedDetail = `Product matched rule: $${purchasePrice.toFixed(2)}`;
      }
    }

    // ── 3. Mark rule as TRIGGERED and write initial audit log ─────────────────
    await prisma.$executeRawUnsafe(
      `UPDATE "Rule" SET status = 'TRIGGERED', updatedAt = CURRENT_TIMESTAMP WHERE id = '${ruleId}';`,
    );

    const logTrigId = `log_exec_${Date.now()}_trig`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, uiIcon)
      VALUES (
        '${logTrigId}', '${ruleId}',
        'Condition met: ${matchedDetail.replace(/'/g, "''")}. Initiating autonomous checkout sequence.',
        CURRENT_TIMESTAMP, 'zap'
      );
    `);

    // ── 4. Hard budget cap checks ─────────────────────────────────────────────
    if (purchasePrice > HARD_CAP) {
      await failRule(
        ruleId,
        `Hard cap violation: $${purchasePrice.toFixed(2)} exceeds system safety limit of $${HARD_CAP.toFixed(2)}. Purchase blocked.`,
      );
      return NextResponse.json({
        success: false,
        error: `Purchase blocked — amount $${purchasePrice.toFixed(2)} exceeds the hard cap of $${HARD_CAP.toFixed(2)}.`,
        rule_status: 'FAILED',
      });
    }

    if (purchasePrice > rule.maxBudget) {
      await failRule(
        ruleId,
        `Budget violation: $${purchasePrice.toFixed(2)} exceeds rule max budget of $${rule.maxBudget.toFixed(2)}. Purchase blocked.`,
      );
      return NextResponse.json({
        success: false,
        error: `Purchase blocked — amount $${purchasePrice.toFixed(2)} exceeds rule max budget $${rule.maxBudget.toFixed(2)}.`,
        rule_status: 'FAILED',
      });
    }

    // ── 5. Generate Prava single-use Payment Token ────────────────────────────
    const logTokenId = `log_exec_${Date.now()}_token`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, uiIcon)
      VALUES (
        '${logTokenId}', '${ruleId}',
        'Requesting Prava single-use Payment Token against active mandate...',
        CURRENT_TIMESTAMP, 'credit-card'
      );
    `);

    const tokenResult = await generatePaymentToken({
      userId: rule.userId || 'usr_alex_rivera_demo',
      userEmail: 'alex.shopper@example.com',
      amount: purchasePrice,
      maxBudget: rule.maxBudget,
      productName: rule.targetItem,
      merchantName: isDomain ? 'Domain Registrar (Mock)' : 'Mock Commerce Store',
      merchantUrl: isDomain ? 'https://mock-registrar.example.com' : 'http://localhost:3000/api/mock-store',
    });

    pravaSessionId = tokenResult.paymentToken; // used as session reference in audit logs

    // Update the token audit log with the actual session id
    const logTokenSessionId = `log_exec_${Date.now()}_sess`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, pravaSessionId, uiIcon)
      VALUES (
        '${logTokenSessionId}', '${ruleId}',
        'Prava single-use Payment Token generated successfully${tokenResult.isMock ? ' (Sandbox/Mock)' : ''}.',
        CURRENT_TIMESTAMP, '${tokenResult.paymentToken.replace(/'/g, "''")}', 'credit-card'
      );
    `);

    // ── 6. Send token to the mock store / domain API ──────────────────────────
    let txnRefId = tokenResult.txnLineItemId;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (isDomain) {
      const domainRes = await fetch(`${baseUrl}/api/check-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          domain: rule.targetItem,
          price: purchasePrice,
          paymentToken: tokenResult.paymentToken,
        }),
      });
      const domainData = await domainRes.json();
      if (!domainData.success) {
        throw new Error(domainData.error || 'Domain registration failed.');
      }
      txnRefId = domainData.txnRefId || txnRefId;
    } else {
      // Product purchase
      if (productId) {
        const checkoutRes = await fetch(`${baseUrl}/api/mock-store/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            price: purchasePrice,
            paymentToken: tokenResult.paymentToken,
          }),
        });
        const checkoutData = await checkoutRes.json();
        if (!checkoutData.success) {
          throw new Error(checkoutData.error || 'Storefront checkout failed.');
        }
        txnRefId = checkoutData.txnRefId || txnRefId;
      }
    }

    // ── 7. Success: update DB, write audit logs, create CommerceTransaction ───
    const receiptId = `rcpt_${Math.random().toString(36).slice(2, 10)}`;
    const receiptUrl = `https://prava.pay/receipts/${receiptId}`;

    // Create CommerceTransaction record
    const txId = `tx_${Date.now()}`;
    const txHash = `0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "CommerceTransaction" (id, userId, itemTitle, amount, status, txHash, createdAt)
      VALUES (
        '${txId}',
        '${rule.userId || 'usr_alex_rivera_demo'}',
        '${rule.targetItem.replace(/'/g, "''")}',
        ${purchasePrice},
        'COMPLETED',
        '${txHash}',
        CURRENT_TIMESTAMP
      );
    `);

    // Update PaymentSession if one exists (linked by pravaSessionId in audit logs)
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "PaymentSession"
        SET status = 'CAPTURED', updatedAt = CURRENT_TIMESTAMP
        WHERE pravaTxId IN (
          SELECT pravaSessionId FROM "AuditLog"
          WHERE ruleId = '${ruleId}' AND pravaSessionId IS NOT NULL
          LIMIT 1
        );
      `);
    } catch (_) {
      // Non-fatal — PaymentSession may not exist if mandate was simulated
    }

    // Update rule to SUCCESS
    await prisma.$executeRawUnsafe(
      `UPDATE "Rule" SET status = 'SUCCESS', updatedAt = CURRENT_TIMESTAMP WHERE id = '${ruleId}';`,
    );

    // Write final success audit log
    const logSuccessId = `log_exec_${Date.now()}_success`;
    const safeToken = tokenResult.paymentToken.replace(/'/g, "''");
    const safeReceipt = receiptUrl.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, pravaSessionId, receiptUrl, uiIcon)
      VALUES (
        '${logSuccessId}', '${ruleId}',
        'Autonomous payment authorized via Prava virtual card. Checkout completed successfully. Tx: ${txHash}',
        CURRENT_TIMESTAMP, '${safeToken}', '${safeReceipt}', 'check-circle'
      );
    `);

    // Report APPROVED status back to Prava (best-effort)
    await reportPravaStatus({
      sessionId: tokenResult.paymentToken,
      txnRefId,
      status: 'APPROVED',
    }).catch((e) => console.warn('[execute-purchase] reportPravaStatus APPROVED failed:', e));

    console.log(`[execute-purchase] Rule ${ruleId} completed → SUCCESS ($${purchasePrice.toFixed(2)})`);

    return NextResponse.json({
      success: true,
      rule_status: 'SUCCESS',
      purchaseAmount: purchasePrice,
      paymentToken: tokenResult.paymentToken,
      txnRefId,
      txHash,
      receiptUrl,
      isMock: tokenResult.isMock,
    });

  } catch (error: any) {
    console.error('[execute-purchase] Error:', error);

    // Mark rule as FAILED and log
    if (ruleId) {
      await failRule(
        ruleId,
        `Execution failed: ${error.message || 'Unknown error'}`,
      );

      // Report DECLINED to Prava (best-effort)
      if (pravaSessionId) {
        await reportPravaStatus({
          sessionId: pravaSessionId,
          txnRefId: `fail_${Date.now()}`,
          status: 'DECLINED',
        }).catch(() => {});
      }
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Purchase execution failed', rule_status: 'FAILED' },
      { status: 500 },
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function failRule(ruleId: string, message: string) {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Rule" SET status = 'FAILED', updatedAt = CURRENT_TIMESTAMP WHERE id = '${ruleId}';`,
    );
    const logId = `log_exec_${Date.now()}_fail`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, uiIcon)
      VALUES (
        '${logId}', '${ruleId}',
        '${message.replace(/'/g, "''")}',
        CURRENT_TIMESTAMP, 'alert-triangle'
      );
    `);
  } catch (e) {
    console.error('[execute-purchase] failRule error:', e);
  }
}
