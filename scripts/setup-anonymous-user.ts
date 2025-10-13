import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAnonymousUser() {
  try {
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
  } catch (error) {
    console.error('Error creating anonymous user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAnonymousUser();
