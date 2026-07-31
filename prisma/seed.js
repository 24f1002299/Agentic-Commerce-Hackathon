const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample Users, Rules, and Audit Logs...');

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.rule.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Demo User
  const user = await prisma.user.create({
    data: {
      email: 'alex.shopper@example.com',
      name: 'Alex Rivera',
    },
  });

  console.log(`Created user: ${user.name} (${user.id})`);

  // 2. Create Rules in different states

  // Rule 1: ACTIVE / Monitoring state
  const ruleActive = await prisma.rule.create({
    data: {
      userId: user.id,
      naturalLanguageQuery: 'Buy Sony WH-1000XM5 wireless headphones when price drops below $300',
      targetItem: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      maxBudget: 300.0,
      status: 'ACTIVE', // ACTIVE / Monitoring
      auditLogs: {
        create: [
          {
            action: 'Agent initiated price monitoring on Amazon, BestBuy, and B&H',
            uiIcon: 'search',
            timestamp: new Date(Date.now() - 3600000 * 5),
          },
          {
            action: 'Current lowest price detected: $348.00 (Threshold: $300.00). Continuing check loop.',
            uiIcon: 'activity',
            timestamp: new Date(Date.now() - 3600000 * 2),
          },
        ],
      },
    },
  });

  // Rule 2: SUCCESS / Completed Purchase
  const ruleSuccess = await prisma.rule.create({
    data: {
      userId: user.id,
      naturalLanguageQuery: 'Purchase Keychron K2 Mechanical Keyboard if under $85',
      targetItem: 'Keychron K2 Wireless Mechanical Keyboard (Tactile Brown)',
      maxBudget: 85.0,
      status: 'SUCCESS',
      auditLogs: {
        create: [
          {
            action: 'Rule activated by user with maximum budget limit of $85.00',
            uiIcon: 'shield-check',
            timestamp: new Date(Date.now() - 3600000 * 24),
          },
          {
            action: 'Price drop detected at $79.99 on Keychron Direct Store',
            uiIcon: 'tag',
            timestamp: new Date(Date.now() - 3600000 * 12),
          },
          {
            action: 'Created Prava AP2 (Agent-to-Pay) virtual single-use card session',
            pravaSessionId: 'prv_sess_89f3a1b2c4e5',
            uiIcon: 'credit-card',
            timestamp: new Date(Date.now() - 3600000 * 11),
          },
          {
            action: 'Autonomous checkout completed successfully. Receipt generated.',
            pravaSessionId: 'prv_sess_89f3a1b2c4e5',
            receiptUrl: 'https://prava.pay/receipts/rcpt_982314a8',
            uiIcon: 'check-circle',
            timestamp: new Date(Date.now() - 3600000 * 10),
          },
        ],
      },
    },
  });

  // Rule 3: TRIGGERED / Checkout in progress
  const ruleTriggered = await prisma.rule.create({
    data: {
      userId: user.id,
      naturalLanguageQuery: 'Auto-buy Dell UltraSharp 27" 4K USB-C Monitor if price <= $450',
      targetItem: 'Dell UltraSharp U2723QE 27-inch 4K UHD Hub Monitor',
      maxBudget: 450.0,
      status: 'TRIGGERED',
      auditLogs: {
        create: [
          {
            action: 'Target item reached deal threshold: Current price $439.99 (Budget $450.00)',
            uiIcon: 'zap',
            timestamp: new Date(Date.now() - 1800000),
          },
          {
            action: 'Initiated checkout sequence & requesting Prava pre-authorization token',
            pravaSessionId: 'prv_sess_77a4b2c198ef',
            uiIcon: 'credit-card',
            timestamp: new Date(Date.now() - 600000),
          },
        ],
      },
    },
  });

  // Rule 4: PENDING_APPROVAL / Awaiting User Consent
  const rulePending = await prisma.rule.create({
    data: {
      userId: user.id,
      naturalLanguageQuery: 'Order Herman Miller Sayl Chair if available in White/Fog under $600',
      targetItem: 'Herman Miller Sayl Ergonomic Gaming Chair (Fog/White)',
      maxBudget: 600.0,
      status: 'PENDING_APPROVAL',
      auditLogs: {
        create: [
          {
            action: 'Rule generated via natural language input: "Order Herman Miller Sayl Chair if available in White/Fog under $600"',
            uiIcon: 'file-text',
            timestamp: new Date(Date.now() - 7200000),
          },
          {
            action: 'High-value transaction mandate requires explicit user sign-off prior to activation',
            uiIcon: 'lock',
            timestamp: new Date(Date.now() - 7100000),
          },
        ],
      },
    },
  });

  // Rule 5: FAILED / Out of budget or payment decline
  const ruleFailed = await prisma.rule.create({
    data: {
      userId: user.id,
      naturalLanguageQuery: 'Grab Apple iPad Air M2 if flash sale drops below $400',
      targetItem: 'Apple iPad Air 11-inch M2 (128GB, Space Gray)',
      maxBudget: 400.0,
      status: 'FAILED',
      auditLogs: {
        create: [
          {
            action: 'Rule activated for limited flash sale monitoring',
            uiIcon: 'search',
            timestamp: new Date(Date.now() - 3600000 * 48),
          },
          {
            action: 'Flash sale item sold out during merchant cart reservation step',
            uiIcon: 'alert-triangle',
            timestamp: new Date(Date.now() - 3600000 * 36),
          },
        ],
      },
    },
  });

  console.log('Successfully seeded database:');
  console.log(`- Rule ACTIVE: ${ruleActive.id}`);
  console.log(`- Rule SUCCESS: ${ruleSuccess.id}`);
  console.log(`- Rule TRIGGERED: ${ruleTriggered.id}`);
  console.log(`- Rule PENDING_APPROVAL: ${rulePending.id}`);
  console.log(`- Rule FAILED: ${ruleFailed.id}`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
