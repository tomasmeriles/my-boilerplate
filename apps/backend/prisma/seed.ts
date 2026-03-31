import 'dotenv/config';
import { PrismaClient, GlobalRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await seedSuperAdmin();
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const name = process.env.SUPER_ADMIN_NAME;

  if (!email) {
    console.log('SUPER_ADMIN_EMAIL not set - skipping super admin seed.');
    return;
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: name ?? 'Super Admin',
      globalRole: GlobalRole.SUPER_ADMIN,
    },
    update: { globalRole: GlobalRole.SUPER_ADMIN },
  });

  console.log(`SUPER_ADMIN ensured with ID: ${user.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
