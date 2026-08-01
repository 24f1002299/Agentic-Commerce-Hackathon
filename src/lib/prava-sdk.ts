/**
 * prava-sdk.ts
 *
 * Thin wrapper around the Prava Payments REST API (sandbox).
 * Every function matches the official docs at docs.prava.space exactly.
 *
 * Sandbox base URL : https://sandbox.api.prava.space
 * Auth header      : Authorization: Bearer sk_test_...
 *
 * Team-specific test card (from Prava correction email):
 *   Card  : 4622 9431 2323 2390
 *   CVV   : 867
 *   Expiry: 12/30          ← CORRECTED (was wrongly 12/27)
 *   OTP   : 456789
 */

const PRAVA_BASE = process.env.PRAVA_API_BASE || 'https://sandbox.api.prava.space';
const PLACEHOLDER_KEY = 'sk_test_REPLACE_ME';

/* ------------------------------------------------------------------ */
/*  Key helpers                                                        */
/* ------------------------------------------------------------------ */

function getSecretKey(): string {
  const key = process.env.PRAVA_API_KEY;
  if (!key || key === PLACEHOLDER_KEY) {
    throw new Error(
      'PRAVA_API_KEY is not set. Add your sk_test_... key to .env.local',
    );
  }
  if (!key.startsWith('sk_')) {
    throw new Error(
      `PRAVA_API_KEY must be a SECRET key (sk_test_...). You have "${key.slice(0, 8)}..." which looks like a publishable key.`,
    );
  }
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    'Content-Type': 'application/json',
  };
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PravaSessionResult {
  session_id: string;
  session_token: string;
  iframe_url: string;
  order_id: string;
  expires_at: string;
  authorizeOnly?: boolean;
  _mock?: boolean;
}

export interface PravaMandate {
  id: string;
  status: 'pending' | 'active' | 'paused' | 'consumed' | 'cancelled' | 'expired';
  state?: 'available' | 'consumed' | 'expired';
  approvedAmount: string;
  remaining?: string;
  currency: string;
  recurringFrequency?: string;
  merchantScope?: string;
  merchantName?: string;
  spent?: string;
  chargeCount?: number;
  charges?: Array<{
    transactionId: string;
    amount: string;
    currency: string;
    status: string;
    reference?: string;
    createdAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PravaChargeResult {
  mandateId: string;
  instructionId: string;
  transactionId: string;
  orderId: string;
  status: 'awaiting_result' | 'failed';
  fetchStatus: 'SUCCESS' | 'FAILURE';
  credentials?: {
    token: string;
    dynamicCvv: string;
    expiryMonth: string;
    expiryYear: string;
  };
  encrypted_payload?: {
    ephemeral_public_key: string;
    iv: string;
    auth_tag: string;
    data: string;
  };
  errorCode?: string;
  errorMessage?: string;
  deduplicated: boolean;
}

export interface PravaReportResult {
  mandateId: string;
  transactionId: string;
  orderId: string;
  status: 'completed' | 'failed';
  mandateStatus: string;
  visaConfirmation: 'SUCCESS' | 'FAILURE';
}

/* ------------------------------------------------------------------ */
/*  1. Create Session (mandate setup)                                  */
/*     POST /v1/sessions                                              */
/*     Docs: docs.prava.space/api-reference/create-session             */
/* ------------------------------------------------------------------ */

export async function createPravaSession(opts: {
  userId: string;
  userEmail: string;
  amount: number;
  productName: string;
  merchantName: string;
  merchantUrl: string;
  merchantCountry?: string;
  recurringFrequency?: string;
  maxCharges?: number;
}): Promise<PravaSessionResult> {
  const amountStr = opts.amount.toFixed(2);

  // Exact body shape from the official docs (mandate setup variant)
  const body = {
    user_id: opts.userId,
    user_email: opts.userEmail,
    total_amount: amountStr,
    currency: 'USD',
    purchase_context: [
      {
        merchant_details: {
          name: opts.merchantName,
          url: opts.merchantUrl,
          country_code_iso2: opts.merchantCountry || 'US',
        },
        product_details: [
          {
            description: opts.productName,
            unit_price: amountStr,
            quantity: 1,
          },
        ],
      },
    ],
    mandate_setup: {
      intent: 'mandate_setup',
      recurring_frequency: opts.recurringFrequency || 'one_time',
      merchant_scope: 'listed',
      max_charges: opts.maxCharges ?? 1,
    },
  };

  const res = await fetch(`${PRAVA_BASE}/v1/sessions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)');
    throw new Error(
      `Prava createSession failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  const data = await res.json();

  return {
    session_id: data.session_id,
    session_token: data.session_token,
    iframe_url: data.iframe_url,
    order_id: data.order_id,
    expires_at: data.expires_at,
    authorizeOnly: data.authorizeOnly ?? true,
    _mock: false,
  };
}

/* ------------------------------------------------------------------ */
/*  2. List Mandates                                                   */
/*     GET /v1/mandates?customer_id=...&standing_only=true             */
/*     Docs: docs.prava.space/api-reference/mandate-list               */
/* ------------------------------------------------------------------ */

export async function listPravaMandates(
  customerId: string,
  standingOnly = true,
): Promise<PravaMandate[]> {
  const params = new URLSearchParams({
    customer_id: customerId,
    standing_only: String(standingOnly),
  });

  const res = await fetch(`${PRAVA_BASE}/v1/mandates?${params}`, {
    method: 'GET',
    headers: headers(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)');
    throw new Error(
      `Prava listMandates failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  const data = await res.json();
  return data.mandates ?? [];
}

/* ------------------------------------------------------------------ */
/*  3. Get a single Mandate                                            */
/*     GET /v1/mandates/{id}                                          */
/*     Docs: docs.prava.space/api-reference/mandate-get                */
/* ------------------------------------------------------------------ */

export async function getPravaMandate(mandateId: string): Promise<PravaMandate> {
  const res = await fetch(`${PRAVA_BASE}/v1/mandates/${mandateId}`, {
    method: 'GET',
    headers: headers(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)');
    throw new Error(
      `Prava getMandate failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  return res.json();
}

/* ------------------------------------------------------------------ */
/*  4. Poll until the mandate becomes "active"                         */
/*     (user completes passkey approval in the hosted iframe)          */
/* ------------------------------------------------------------------ */

export async function pollMandateActive(
  customerId: string,
  opts: { maxAttempts?: number; intervalMs?: number } = {},
): Promise<PravaMandate | null> {
  const maxAttempts = opts.maxAttempts ?? 30;
  const intervalMs = opts.intervalMs ?? 3000;

  for (let i = 0; i < maxAttempts; i++) {
    const mandates = await listPravaMandates(customerId, true);
    const active = mandates.find(
      (m) => m.status === 'active' || m.state === 'available',
    );
    if (active) return active;

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  5. Charge a Mandate                                                */
/*     POST /v1/mandates/{id}/charge                                  */
/*     Docs: docs.prava.space/api-reference/mandate-charge             */
/* ------------------------------------------------------------------ */

export async function chargePravaMandate(
  mandateId: string,
  amount: number,
  reference?: string,
): Promise<PravaChargeResult> {
  const body: Record<string, string> = {
    amount: amount.toFixed(2),
  };
  if (reference) body.reference = reference;

  const res = await fetch(`${PRAVA_BASE}/v1/mandates/${mandateId}/charge`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)');
    throw new Error(
      `Prava chargeMandate failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  return res.json();
}

/* ------------------------------------------------------------------ */
/*  6. Report a Mandate Charge                                         */
/*     POST /v1/mandates/{id}/charges/{txnId}/report                  */
/*     Docs: docs.prava.space/api-reference/report-a-mandate-charge    */
/* ------------------------------------------------------------------ */

export async function reportPravaMandateCharge(
  mandateId: string,
  transactionId: string,
  opts: {
    txnStatus: 'APPROVED' | 'DECLINED';
    amountPaid: string;
    authorizationCode?: string;
    responseCode?: string;
  },
): Promise<PravaReportResult> {
  const body: Record<string, string> = {
    txn_status: opts.txnStatus,
    txn_type: 'PURCHASE',
    amount_paid: opts.amountPaid,
  };
  if (opts.authorizationCode) body.authorization_code = opts.authorizationCode;
  if (opts.responseCode) body.response_code = opts.responseCode;

  const res = await fetch(
    `${PRAVA_BASE}/v1/mandates/${mandateId}/charges/${transactionId}/report`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)');
    throw new Error(
      `Prava reportCharge failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  return res.json();
}