import { NextRequest, NextResponse } from 'next/server';
import { findPravaMandate } from '@/lib/prava-sdk';

/**
 * GET /api/prava/mandate-status?userId=xxx&amount=50
 *
 * The hosted Prava approval page is cross-origin, so the browser cannot
 * read its completion state directly. The frontend polls this endpoint
 * until the mandate becomes active.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const userId =
    params.get('userId') ||
    process.env.PRAVA_CUSTOMER_ID ||
    'usr_agentic_commerce_hackathon';
  const amount = Number(params.get('amount')) || 0;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Missing userId.' },
      { status: 400 },
    );
  }

  try {
    const mandate = await findPravaMandate({ customerId: userId, amount });

    return NextResponse.json({
      success: true,
      status: mandate ? 'active' : 'pending',
      mandateId: mandate?.id ?? null,
      approvedAmount: mandate?.approvedAmount ?? null,
    });
  } catch (error: any) {
    console.error('[mandate-status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to read Prava mandate status.',
      },
      { status: 502 },
    );
  }
}