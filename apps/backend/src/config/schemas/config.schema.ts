import { z } from 'zod';

export const configSchema = z.object({
  // ---------------------------------------------------------------------------
  // Critical configs - if any of these are missing/invalid, the app would fail to start.
  // ---------------------------------------------------------------------------
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  FRONTEND_URL: z.string().url(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_MINUTES: z.coerce.number(),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number(),

  // Redis
  REDIS_URL: z.string().url(),

  // ---------------------------------------------------------------------------
  // Non-critical configs - these have defaults, so the app can start even if they're missing/invalid.
  // ---------------------------------------------------------------------------
  PORT: z.coerce.number().default(3000),

  // Rate limiting - fallback for endpoints without an explicit @Throttle() decorator
  THROTTLE_TTL_SECONDS: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(30),
});

export type AppConfig = z.infer<typeof configSchema>;
