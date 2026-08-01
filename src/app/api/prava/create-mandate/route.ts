import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPravaSession } from '@/lib/prava-sdk';

/**
 * POST /api/prava/create-mandate
 *
 * Called when the user clicks "Approve with Passkey" on a PENDING_APPROVAL rule.
 *
 * Prava flow (docs.prava.space/api-reference/create-session):
 *   1. POST /v1/sessions with mandate_setup block
 *      → returns { session_id, session_token, iframe_url, order_id, authorizeOnly: true }
 *   2. Frontend opens iframe_url in a new tab
 *   3. User enters sandbox card + completes passkey → mandate becomes "active"
 *   4. Agent loop polls GET /v1/mandates?customer_id=... for the active mandate
 *   5. POST /v1/mandates/{id}/charge → single-use credentials
 *   6. POST /v1/mandates/{id}/charges/{txnId}/report → settles the charge
 *
 * Team sandbox card (from Prava correction email):
 *   4622 9431 2323 2390 / 867 / 12/30   ← expiry is 12/30, NOT 12/27
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId, maxBudget, targetItem, userId = 'usr_sentinel_demo' } = body;

    // Stable Prava customer identity. Override via env if needed.
    const pravaCustomerId =
      process.env.PRAVA_CUSTOMER_ID || 'usr_agentic_commerce_hackathon';

    const budget = Number(maxBudget);
    if (!Number.isFinite(budget) || budget <= 0 || !targetItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid required fields: maxBudget, targetItem',
        },
        { status: 400 },
      );
    }

    // ── 1. Create the mandate-setup session via Prava ──────────────────
    const pravaSession = await createPravaSession({
      userId: pravaCustomerId,
      userEmail: process.env.PRAVA_USER_EMAIL || 'hasratmd697@gmail.com',
      amount: budget,
      productName: targetItem,
      // Must match the merchant profile in the Prava dashboard exactly.
      merchantName:
        process.env.PRAVA_MERCHANT_NAME || 'Sentinel Autonomous Procurement',
      merchantUrl: process.env.PRAVA_MERCHANT_URL || 'https://acme.com',
      merchantCountry: 'US',
      recurringFrequency: 'one_time',
      maxCharges: 1,
    });

    const isMock = pravaSession._mock ?? false;
    const sessionId = pravaSession.session_id;

    // ── 2. Persist session in DB ───────────────────────────────────────
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "PaymentSession" (
          id, merchantId, amount, currency, status,
          pravaTxId, metadata, createdAt, updatedAt
        ) VALUES (
          '${sessionId}',
          '${(process.env.PRAVA_MERCHANT_NAME || 'Sentinel Autonomous Procurement').replace(/'/g, "''")}',
          ${budget},
          'USD',
          'INITIATED',
          '${sessionId}',
          '${JSON.stringify({
            targetItem,
            ruleId,
            userId,
            pravaCustomerId,
            isMock,
            orderId: pravaSession.order_id,
          }).replace(/'/g, "''")}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      `);
    } catch (dbErr: any) {
      console.warn('[create-mandate] DB insert skipped:', dbErr.message);
    }

    // ── 3. Audit log ───────────────────────────────────────────────────
    if (ruleId) {
      const logId = `log_${Date.now()}`;
      const action = isMock
        ? `Prava mandate session initialized (sandbox mock) for ${targetItem} — limit $${budget.toFixed(2)}.`
        : `Prava mandate session created (${sessionId}) for ${targetItem} — limit $${budget.toFixed(2)}. Awaiting hosted passkey approval.`;

      await prisma.$executeRawUnsafe(`
        INSERT INTO "AuditLog" (id, ruleId, action, timestamp, pravaSessionId, uiIcon)
        VALUES (
          '${logId}',
          '${ruleId}',
          '${action.replace(/'/g, "''")}',
          CURRENT_TIMESTAMP,
          '${sessionId}',
          'lock'
        );
      `);
    }

    // ── 4. Return to frontend ──────────────────────────────────────────
    return NextResponse.json({
      success: true,
      sessionId,
      sessionToken: pravaSession.session_token,
      iframeUrl: pravaSession.iframe_url,
      orderId: pravaSession.order_id,
      pravaCustomerId,
      isMock,
    });
  } catch (error: any) {
    console.error('[create-mandate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create Prava mandate session',
      },
      { status: 500 },
    );
  }
}