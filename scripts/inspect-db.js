process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';

const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('Using DATABASE_URL=', process.env.DATABASE_URL);
    const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Tables:');
    console.dir(tables, { depth: null });

    // Try to read users via Prisma model
    try {
      const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, createdAt: true }, take: 20 });
      console.log('User rows count:', users.length);
      console.table(users);
    } catch (e) {
      console.error('Error querying User model:', e.message || e);
    }
  } catch (err) {
    console.error('Error inspecting DB:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
