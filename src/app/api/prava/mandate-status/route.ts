import { NextRequest, NextResponse } from 'next/server';
import { findPravaMandate } from '@/lib/prava-sdk';

/**
 * GET /api/prava/mandate-status
 *
 * The hosted Prava approval surface is cross-origin, so the browser cannot
 * read its completion state directly. Poll this server-side endpoint until
 * the mandate created for the customer becomes active.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const userId = params.get('userId');
  const amount = Number(params.get('amount'));

  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid userId and amount.' },
      { status: 400 },
    );
  }

  try {
    const mandate = await findPravaMandate({ customerId: userId, amount });

    return NextResponse.json({
      success: true,
      status: mandate ? 'active' : 'pending',
      mandateId: mandate?.id ?? null,
    });
  } catch (error: any) {
    console.error('[mandate-status] Failed to find Prava mandate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to read Prava mandate status.' },
      { status: 502 },
    );
  }
}
