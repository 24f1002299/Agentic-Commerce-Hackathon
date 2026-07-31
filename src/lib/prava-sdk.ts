/**
 * Prava SDK Wrapper — Server-side only
 *
 * When PRAVA_API_KEY is set to a real `sk_test_...` value, this calls the live
 * Prava sandbox API (https://sandbox.api.prava.space/v1).
 * When the key is the placeholder value or absent, it generates a local
 * mock token so the rest of the pipeline can run end-to-end in development.
 */

const PRAVA_API_BASE = 'https://sandbox.api.prava.space/v1';
const PLACEHOLDER_KEY = 'prava_test_key_placeholder';

function isRealKey(key: string | undefined): boolean {
  return !!key && key.startsWith('sk_') && key !== PLACEHOLDER_KEY;
}

function buildAuthHeader(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.PRAVA_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PravaSession {
  session_id: string;
  iframe_url: string;
  payment_token?: string;
}

export interface PravaPaymentResult {
  status: string; // 'pending' | 'awaiting_result' | 'completed' | 'failed'
  payment_token?: string;
  txn_line_item_id?: string;
  token_details?: {
    card_number: string;
    expiry: string;
    cvv: string;
    card_type: string;
  };
}

export interface PravaTokenResult {
  /** The single-use Prava payment token identifier */
  paymentToken: string;
  /** The line-item transaction reference from Prava */
  txnLineItemId: string;
  /** Whether the token was generated locally (mock) or by the live Prava API */
  isMock: boolean;
}

// ─── Create Session ────────────────────────────────────────────────────────────

/**
 * Create a Prava payment session for a mandate-backed purchase.
 * Returns the sessionId, iframe_url, and (for mocks) a pre-generated token.
 */
export async function createPravaSession(params: {
  userId: string;
  userEmail: string;
  amount: number;
  productName: string;
  merchantName: string;
  merchantUrl: string;
}): Promise<PravaSession> {
  const key = process.env.PRAVA_API_KEY;

  if (isRealKey(key)) {
    const body = {
      user_id: params.userId,
      user_email: params.userEmail,
      total_amount: params.amount.toFixed(2),
      currency: 'USD',
      integration_type: 'embedding',
      purchase_context: [
        {
          merchant_details: {
            name: params.merchantName,
            url: params.merchantUrl,
            country_code_iso2: 'US',
          },
          product_details: [
            {
              description: params.productName,
              unit_price: params.amount.toFixed(2),
              quantity: 1,
            },
          ],
        },
      ],
    };

    const res = await fetch(`${PRAVA_API_BASE}/sessions`, {
      method: 'POST',
      headers: buildAuthHeader(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Prava createSession failed: ${res.status} — ${err}`);
    }

    const data = await res.json();
    return {
      session_id: data.session_id,
      iframe_url: data.iframe_url ?? '',
    };
  }

  // ── Mock path ──
  const mockSessionId = `ses_mock_${Math.random().toString(16).slice(2, 14)}`;
  return {
    session_id: mockSessionId,
    iframe_url: `https://sandbox.prava.space/checkout/${mockSessionId}`,
    payment_token: `prv_tok_${Math.random().toString(16).slice(2, 20)}`,
  };
}

// ─── Poll Payment Result ───────────────────────────────────────────────────────

/**
 * Poll the Prava session result endpoint up to `maxAttempts` times.
 * In mock mode, immediately returns a synthetic result.
 */
export async function getPravaPaymentResult(
  sessionId: string,
  maxAttempts = 5,
  intervalMs = 1000,
): Promise<PravaPaymentResult> {
  const key = process.env.PRAVA_API_KEY;

  if (isRealKey(key)) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await fetch(
        `${PRAVA_API_BASE}/sessions/${sessionId}/payment-result`,
        { headers: buildAuthHeader() },
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Prava getPaymentResult failed: ${res.status} — ${err}`);
      }

      const data: PravaPaymentResult = await res.json();

      if (data.status === 'awaiting_result' || data.status === 'completed') {
        return data;
      }

      if (data.status === 'failed') {
        throw new Error('Prava payment session failed.');
      }

      // Still pending — wait before next poll
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error('Prava payment result timed out after polling.');
  }

  // ── Mock path ── instant success
  return {
    status: 'awaiting_result',
    payment_token: `prv_tok_${Math.random().toString(16).slice(2, 20)}`,
    txn_line_item_id: `tli_${Math.random().toString(36).slice(2, 10)}`,
    token_details: {
      card_number: '4111111111111111',
      expiry: '12/27',
      cvv: '737',
      card_type: 'Visa',
    },
  };
}

// ─── Generate Single-Use Payment Token ────────────────────────────────────────

/**
 * End-to-end helper: creates a session + polls for the single-use payment
 * token generated by Prava against the active mandate.
 *
 * Budget cap is enforced here: amount must be ≤ rule.maxBudget AND ≤ $60.00.
 */
export async function generatePaymentToken(params: {
  userId: string;
  userEmail: string;
  amount: number;
  maxBudget: number;
  productName: string;
  merchantName: string;
  merchantUrl: string;
}): Promise<PravaTokenResult> {
  // ── Hard budget safety cap ──
  const HARD_CAP = 60.0;

  if (params.amount > params.maxBudget) {
    throw new Error(
      `Budget violation: purchase amount $${params.amount.toFixed(2)} exceeds rule max budget $${params.maxBudget.toFixed(2)}.`,
    );
  }

  if (params.amount > HARD_CAP) {
    throw new Error(
      `Hard cap violation: purchase amount $${params.amount.toFixed(2)} exceeds the system-wide safety limit of $${HARD_CAP.toFixed(2)}.`,
    );
  }

  // ── Create Prava Session ──
  const session = await createPravaSession(params);

  // If the mock path pre-baked a token, use it directly
  if (session.payment_token) {
    return {
      paymentToken: session.payment_token,
      txnLineItemId: `tli_${Math.random().toString(36).slice(2, 10)}`,
      isMock: true,
    };
  }

  // ── Poll for the real token ──
  const result = await getPravaPaymentResult(session.session_id);

  if (!result.payment_token) {
    throw new Error('Prava did not return a payment token.');
  }

  return {
    paymentToken: result.payment_token,
    txnLineItemId: result.txn_line_item_id ?? `tli_${Date.now()}`,
    isMock: false,
  };
}

// ─── Report Status ─────────────────────────────────────────────────────────────

/**
 * Report the final transaction outcome back to Prava.
 * Required to close the mandate loop for audit/compliance.
 */
export async function reportPravaStatus(params: {
  sessionId: string;
  txnRefId: string;
  status: 'APPROVED' | 'DECLINED';
}): Promise<void> {
  const key = process.env.PRAVA_API_KEY;

  if (isRealKey(key)) {
    const res = await fetch(
      `${PRAVA_API_BASE}/sessions/${params.sessionId}/report-status`,
      {
        method: 'POST',
        headers: buildAuthHeader(),
        body: JSON.stringify({
          txn_ref_id: params.txnRefId,
          txn_status: params.status,
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`Prava reportStatus failed: ${res.status} — ${err}`);
      // Non-fatal — log but don't throw, the purchase is already done
    }
  }
  // Mock path: no-op
}
