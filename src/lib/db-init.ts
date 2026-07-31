import { prisma } from './prisma';

export async function ensureDatabaseSeeded() {
  try {
    // 1. Create tables if they do not exist via raw SQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AgentTask" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "result" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PaymentSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "merchantId" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "status" TEXT NOT NULL DEFAULT 'INITIATED',
        "pravaTxId" TEXT,
        "metadata" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CommerceTransaction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "itemTitle" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'COMPLETED',
        "txHash" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Rule" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "naturalLanguageQuery" TEXT NOT NULL,
        "targetItem" TEXT NOT NULL,
        "maxBudget" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ruleId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "pravaSessionId" TEXT,
        "receiptUrl" TEXT,
        "uiIcon" TEXT NOT NULL DEFAULT 'search',
        FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 2. Check if Rules already exist
    const existingRulesCountArr = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM "Rule";`
    );
    const existingRulesCount = existingRulesCountArr[0]?.count ?? 0;

    if (existingRulesCount === 0) {
      console.log('No rules found in database. Initializing seed data...');
      
      // Create user if not exists
      const userRes = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "User" LIMIT 1;`
      );
      
      let userId = userRes[0]?.id;
      if (!userId) {
        userId = 'usr_alex_rivera_demo';
        await prisma.$executeRawUnsafe(`
          INSERT INTO "User" (id, email, name)
          VALUES ('${userId}', 'alex.shopper@example.com', 'Alex Rivera');
        `);
      }

      // Insert sample rules & audit logs representing all UI states
      const rules = [
        {
          id: 'rule_active_101',
          naturalLanguageQuery: 'Buy Sony WH-1000XM5 wireless headphones when price drops below $300',
          targetItem: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
          maxBudget: 300.0,
          status: 'ACTIVE',
          logs: [
            {
              id: 'log_act_1',
              action: 'Agent initiated price monitoring on Amazon, BestBuy, and B&H',
              uiIcon: 'search',
            },
            {
              id: 'log_act_2',
              action: 'Current lowest price detected: $348.00 (Threshold: $300.00). Continuing check loop.',
              uiIcon: 'activity',
            },
          ],
        },
        {
          id: 'rule_success_102',
          naturalLanguageQuery: 'Purchase Keychron K2 Mechanical Keyboard if under $85',
          targetItem: 'Keychron K2 Wireless Mechanical Keyboard (Tactile Brown)',
          maxBudget: 85.0,
          status: 'SUCCESS',
          logs: [
            {
              id: 'log_suc_1',
              action: 'Rule activated by user with maximum budget limit of $85.00',
              uiIcon: 'shield-check',
            },
            {
              id: 'log_suc_2',
              action: 'Price drop detected at $79.99 on Keychron Direct Store',
              uiIcon: 'tag',
            },
            {
              id: 'log_suc_3',
              action: 'Created Prava AP2 virtual single-use card session',
              pravaSessionId: 'prv_sess_89f3a1b2c4e5',
              uiIcon: 'credit-card',
            },
            {
              id: 'log_suc_4',
              action: 'Autonomous checkout completed successfully. Receipt generated.',
              pravaSessionId: 'prv_sess_89f3a1b2c4e5',
              receiptUrl: 'https://prava.pay/receipts/rcpt_982314a8',
              uiIcon: 'check-circle',
            },
          ],
        },
        {
          id: 'rule_triggered_103',
          naturalLanguageQuery: 'Auto-buy Dell UltraSharp 27" 4K USB-C Monitor if price <= $450',
          targetItem: 'Dell UltraSharp U2723QE 27-inch 4K UHD Hub Monitor',
          maxBudget: 450.0,
          status: 'TRIGGERED',
          logs: [
            {
              id: 'log_trig_1',
              action: 'Target item reached deal threshold: Current price $439.99 (Budget $450.00)',
              uiIcon: 'zap',
            },
            {
              id: 'log_trig_2',
              action: 'Initiated checkout sequence & requesting Prava pre-authorization token',
              pravaSessionId: 'prv_sess_77a4b2c198ef',
              uiIcon: 'credit-card',
            },
          ],
        },
        {
          id: 'rule_pending_104',
          naturalLanguageQuery: 'Order Herman Miller Sayl Chair if available in White/Fog under $600',
          targetItem: 'Herman Miller Sayl Ergonomic Gaming Chair (Fog/White)',
          maxBudget: 600.0,
          status: 'PENDING_APPROVAL',
          logs: [
            {
              id: 'log_pend_1',
              action: 'Rule generated via natural language input: "Order Herman Miller Sayl Chair..."',
              uiIcon: 'file-text',
            },
            {
              id: 'log_pend_2',
              action: 'High-value transaction mandate requires explicit user sign-off prior to activation',
              uiIcon: 'lock',
            },
          ],
        },
        {
          id: 'rule_failed_105',
          naturalLanguageQuery: 'Grab Apple iPad Air M2 if flash sale drops below $400',
          targetItem: 'Apple iPad Air 11-inch M2 (128GB, Space Gray)',
          maxBudget: 400.0,
          status: 'FAILED',
          logs: [
            {
              id: 'log_fail_1',
              action: 'Rule activated for limited flash sale monitoring',
              uiIcon: 'search',
            },
            {
              id: 'log_fail_2',
              action: 'Flash sale item sold out during merchant cart reservation step',
              uiIcon: 'alert-triangle',
            },
          ],
        },
      ];

      for (const r of rules) {
        await prisma.$executeRawUnsafe(`
          INSERT OR REPLACE INTO "Rule" (id, userId, naturalLanguageQuery, targetItem, maxBudget, status, createdAt, updatedAt)
          VALUES ('${r.id}', '${userId}', '${r.naturalLanguageQuery.replace(/'/g, "''")}', '${r.targetItem.replace(/'/g, "''")}', ${r.maxBudget}, '${r.status}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `);

        for (const log of r.logs) {
          const pravaSess = log.pravaSessionId ? `'${log.pravaSessionId}'` : 'NULL';
          const receipt = log.receiptUrl ? `'${log.receiptUrl}'` : 'NULL';

          await prisma.$executeRawUnsafe(`
            INSERT OR REPLACE INTO "AuditLog" (id, ruleId, action, timestamp, pravaSessionId, receiptUrl, uiIcon)
            VALUES ('${log.id}', '${r.id}', '${log.action.replace(/'/g, "''")}', CURRENT_TIMESTAMP, ${pravaSess}, ${receipt}, '${log.uiIcon}');
          `);
        }
      }

      console.log('Database seeded with sample Rules & AuditLogs successfully!');
    }
  } catch (err) {
    console.error('Database auto-initialization error:', err);
  }
}
