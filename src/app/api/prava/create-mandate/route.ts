import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId, maxBudget, targetItem, userId = 'usr_alex_rivera_demo' } = body;

    // Validate inputs
    if (maxBudget === undefined || !targetItem) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: maxBudget, targetItem' },
        { status: 400 }
      );
    }

    const mandateId = `prv_mand_${crypto.randomBytes(6).toString('hex')}`;
    const challenge = crypto.randomBytes(32).toString('base64url');

    // Create a PaymentSession to represent the mandate session creation in the database
    const sessionId = `prv_sess_${crypto.randomBytes(6).toString('hex')}`;
    
    // Insert record in SQLite for this payment/mandate session
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PaymentSession" (id, merchantId, amount, currency, status, pravaTxId, metadata, createdAt, updatedAt)
      VALUES (
        '${sessionId}',
        'Prava Commerce Mandate Registry',
        ${parseFloat(maxBudget)},
        'USD',
        'INITIATED',
        '${mandateId}',
        '${JSON.stringify({ targetItem, ruleId }).replace(/'/g, "''")}',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    `);

    // If ruleId is provided, log an audit log entry that a mandate creation was initiated
    if (ruleId) {
      const logId = `log_${Date.now()}`;
      const action = `Prava mandate session initiated for ${targetItem} with limit of $${parseFloat(maxBudget).toFixed(2)}.`;
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

    return NextResponse.json({
      success: true,
      mandateId,
      challenge,
      rp: {
        name: 'Prava Commerce',
        id: 'localhost', // Standard fallback identifier for WebAuthn RP
      },
      user: {
        id: userId,
        name: 'Alex Rivera',
        displayName: 'Alex Rivera',
      },
      sessionId,
    });
  } catch (error: any) {
    console.error('API /api/prava/create-mandate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create Prava mandate' },
      { status: 500 }
    );
  }
}
