import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/db-init';

export async function GET() {
  try {
    await ensureDatabaseSeeded();

    // Query Rules with Audit Logs
    const rules = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        r.id, 
        r.userId, 
        r.naturalLanguageQuery, 
        r.targetItem, 
        r.maxBudget, 
        r.status, 
        r.createdAt, 
        r.updatedAt
      FROM "Rule" r
      ORDER BY r.createdAt DESC;
    `);

    // Fetch logs for each rule
    const rulesWithLogs = await Promise.all(
      rules.map(async (rule) => {
        const logs = await prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            id, 
            ruleId, 
            action, 
            timestamp, 
            pravaSessionId, 
            receiptUrl, 
            uiIcon
          FROM "AuditLog"
          WHERE ruleId = '${rule.id}'
          ORDER BY timestamp ASC;
        `);

        return {
          ...rule,
          auditLogs: logs,
        };
      })
    );

    return NextResponse.json({ success: true, rules: rulesWithLogs });
  } catch (error: any) {
    console.error('API /api/rules GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();

    const { naturalLanguageQuery, targetItem, maxBudget, userId = 'usr_alex_rivera_demo' } = body;

    if (!naturalLanguageQuery || !targetItem || !maxBudget) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: naturalLanguageQuery, targetItem, maxBudget' },
        { status: 400 }
      );
    }

    const ruleId = `rule_${Date.now()}`;
    const initialStatus = 'PENDING_APPROVAL';

    // Insert Rule
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Rule" (id, userId, naturalLanguageQuery, targetItem, maxBudget, status, createdAt, updatedAt)
      VALUES (
        '${ruleId}', 
        '${userId}', 
        '${naturalLanguageQuery.replace(/'/g, "''")}', 
        '${targetItem.replace(/'/g, "''")}', 
        ${parseFloat(maxBudget)}, 
        '${initialStatus}', 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      );
    `);

    // Insert initial Audit Log
    const logId = `log_${Date.now()}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, uiIcon)
      VALUES (
        '${logId}', 
        '${ruleId}', 
        'Rule registered via natural language query. Awaiting user verification.', 
        CURRENT_TIMESTAMP, 
        'file-text'
      );
    `);

    return NextResponse.json({
      success: true,
      rule: {
        id: ruleId,
        userId,
        naturalLanguageQuery,
        targetItem,
        maxBudget,
        status: initialStatus,
      },
    });
  } catch (error: any) {
    console.error('API /api/rules POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create rule' },
      { status: 500 }
    );
  }
}
