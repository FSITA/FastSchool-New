import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create anonymous user if it doesn't exist
  const anonymousUser = await prisma.user.upsert({
    where: { id: 'anonymous-user' },
    update: {},
    create: {
      id: 'anonymous-user',
      name: 'Anonymous User',
      email: 'anonymous@example.com',
      role: 'USER',
      hasAccess: true,
    },
  });

  console.log('Anonymous user created/verified:', anonymousUser.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
