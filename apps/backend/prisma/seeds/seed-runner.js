/**
 * Runs a seed as a standalone script with production guard and
 * automatic Prisma client lifecycle management.
 *
 * Accepts the same shape exported by each seed file, so you can do:
 *
 *   const seed = { fn: seedFn, isDevelopmentOnly: false };
 *   if (require.main === module) runStandalone(seed);
 *   module.exports = seed;
 *
 * isDevelopmentOnly: true  -> blocked in production even with SEED_FORCE=true
 * isDevelopmentOnly: false -> allowed in production with SEED_FORCE=true
 *
 * @param {{ fn: (prisma: import('@prisma/client').PrismaClient) => Promise<void>, isDevelopmentOnly?: boolean }} seed
 */
function runStandalone({ fn, isDevelopmentOnly = false }) {
  require('dotenv/config');

  const isProduction = process.env.NODE_ENV === 'production';

  if (isDevelopmentOnly === true && isProduction) {
    console.error('[seed] Blocked: this seed is development-only and cannot run in production.');
    process.exit(1);
  }

  if (isProduction && process.env.SEED_FORCE !== 'true') {
    console.error(
      '[seed] Blocked: NODE_ENV is "production".\n' +
        '       Set SEED_FORCE=true to run seeds in production intentionally.',
    );
    process.exit(1);
  }

  const { PrismaClient } = require('@prisma/client');
  const { PrismaPg } = require('@prisma/adapter-pg');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  fn(prisma)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { runStandalone };
