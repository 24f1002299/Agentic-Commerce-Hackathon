const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking database tables...');
  try {
    const users = await prisma.$queryRawUnsafe(`SELECT * FROM "User"`);
    console.log('Users:', users);
    
    const rules = await prisma.$queryRawUnsafe(`SELECT * FROM "Rule"`);
    console.log('Rules count:', rules.length);
    console.log('Rules:', rules);
    
    const logs = await prisma.$queryRawUnsafe(`SELECT * FROM "AuditLog"`);
    console.log('Audit logs count:', logs.length);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
