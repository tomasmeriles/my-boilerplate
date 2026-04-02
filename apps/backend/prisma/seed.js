require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const superAdminSeed = require('./seeds/super-admin.seed');

/**
 * Seed registry.
 * isDevelopmentOnly: true  -> skipped in production (no override possible)
 * isDevelopmentOnly: false -> runs in production; requires SEED_FORCE=true if NODE_ENV=production
 */
const seeds = [
  { name: 'superAdmin', ...superAdminSeed },
];

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && process.env.SEED_FORCE !== 'true') {
  console.error(
    '[seed] Blocked: NODE_ENV is "production".\n' +
      '       Set SEED_FORCE=true to run seeds in production intentionally.',
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const seed of seeds) {
    if (seed.isDevelopmentOnly === true && isProduction) {
      console.log(`[seed] Skipping "${seed.name}" - dev-only seed, blocked in production.`);
      continue;
    }

    console.log(`[seed] Running "${seed.name}"...`);

    await seed.fn(prisma);

    console.log(`[seed] Done "${seed.name}"`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
