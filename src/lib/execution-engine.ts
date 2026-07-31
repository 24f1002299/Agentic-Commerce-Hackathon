import { prisma } from './prisma';
import { getProducts } from './store-state';

/**
 * Executes the purchase process for a triggered rule.
 * Mimics real-world delays, generates mock session/receipt IDs,
 * writes audit logs, and creates a commerce transaction entry.
 */
export async function executePurchase(rule: any, matchedDetail: string) {
  const ruleId = rule.id;
  const userId = rule.userId || 'usr_alex_rivera_demo';

  console.log(`[Execution Engine] Triggering rule ${ruleId} for "${rule.targetItem}"`);

  try {
    // 1. Update rule status to TRIGGERED
    await prisma.$executeRawUnsafe(`
      UPDATE "Rule"
      SET status = 'TRIGGERED', updatedAt = CURRENT_TIMESTAMP
      WHERE id = '${ruleId}';
    `);

    // Insert TRIGGERED audit log (zap icon)
    const logIdTriggered = `log_trig_${Date.now()}_1`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, uiIcon)
      VALUES (
        '${logIdTriggered}', 
        '${ruleId}', 
        'Condition met: ${matchedDetail.replace(/'/g, "''")}. Initiating checkout sequence.', 
        CURRENT_TIMESTAMP, 
        'zap'
      );
    `);

    // Simulate delay for checkout (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    const fakeSessId = `prv_sess_${Math.random().toString(16).slice(2, 14)}`;
    const fakeReceiptId = `rcpt_${Math.random().toString(36).slice(2, 10)}`;
    const receiptUrl = `https://prava.pay/receipts/${fakeReceiptId}`;
    
    // Find final purchase amount
    let purchaseAmount = rule.maxBudget;
    if (!rule.targetItem.includes('.')) {
      const products = getProducts();
      const target = rule.targetItem.toLowerCase();
      const matchedProduct = products.find(p => 
        p.name.toLowerCase().includes(target) || 
        target.includes(p.name.toLowerCase()) ||
        p.id.toLowerCase().includes(target)
      );
      if (matchedProduct) {
        purchaseAmount = matchedProduct.price;
      }
    }

    // 2. Insert Commerce Transaction record
    const txId = `tx_${Date.now()}`;
    const txHash = `0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "CommerceTransaction" (id, userId, itemTitle, amount, status, txHash, createdAt)
      VALUES (
        '${txId}',
        '${userId}',
        '${rule.targetItem.replace(/'/g, "''")}',
        ${purchaseAmount},
        'COMPLETED',
        '${txHash}',
        CURRENT_TIMESTAMP
      );
    `);

    // 3. Insert Prava session creation log (credit-card icon)
    const logIdSession = `log_trig_${Date.now()}_2`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, pravaSessionId, uiIcon)
      VALUES (
        '${logIdSession}', 
        '${ruleId}', 
        'Created Prava virtual single-use card session.', 
        CURRENT_TIMESTAMP, 
        '${fakeSessId}',
        'credit-card'
      );
    `);

    // 4. Update Rule to SUCCESS and write final log (check-circle icon)
    await prisma.$executeRawUnsafe(`
      UPDATE "Rule"
      SET status = 'SUCCESS', updatedAt = CURRENT_TIMESTAMP
      WHERE id = '${ruleId}';
    `);

    const logIdSuccess = `log_trig_${Date.now()}_3`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuditLog" (id, ruleId, action, timestamp, pravaSessionId, receiptUrl, uiIcon)
      VALUES (
        '${logIdSuccess}', 
        '${ruleId}', 
        'Autonomous payment authorized via Prava virtual card. Checkout completed successfully.', 
        CURRENT_TIMESTAMP, 
        '${fakeSessId}',
        '${receiptUrl}',
        'check-circle'
      );
    `);

    console.log(`[Execution Engine] Rule ${ruleId} completed successfully.`);
  } catch (error) {
    console.error(`[Execution Engine] Error executing rule purchase for rule ${rule.id}:`, error);
  }
}
