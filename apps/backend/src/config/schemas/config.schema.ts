import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const configSchema = z.object({
  // ---------------------------------------------------------------------------
  // Critical configs - if any of these are missing/invalid, the app would fail to start.
  // ---------------------------------------------------------------------------
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  FRONTEND_URL: z.string().url(),

  // Shared registrable domain for cookies (e.g. ".tudominio.com").
  // Required in production so Safari ITP treats auth cookies as first-party.
  // Must start with a dot to cover all subdomains.
  // Leave empty in development (cookies are set for localhost only).
  COOKIE_DOMAIN: z.preprocess(
    emptyToUndefined,
    z.string().startsWith('.').optional(),
  ),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_MINUTES: z.coerce.number(),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number(),

  // CSRF
  CSRF_SECRET: z.string().min(32),

  // Redis
  REDIS_URL: z.string().url(),

  // S3 / Object Storage
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),

  // ---------------------------------------------------------------------------
  // Non-critical configs - these have defaults, so the app can start even if they're missing/invalid.
  // ---------------------------------------------------------------------------
  PORT: z.coerce.number().default(3000),

  // Rate limiting - fallback for endpoints without an explicit @Throttle() decorator
  THROTTLE_TTL_SECONDS: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(30),

  // Logging
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // S3 - optional, only needed for MinIO / self-hosted
  S3_ENDPOINT: z.preprocess(emptyToUndefined, z.string().url().optional()),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
  // CDN or custom public base URL for public objects.
  // If set, getPublicUrl() returns `${S3_PUBLIC_BASE_URL}/${key}`.
  // If omitted, the URL is derived from S3_ENDPOINT (MinIO) or AWS virtual-hosted style.
  S3_PUBLIC_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
});

export type AppConfig = z.infer<typeof configSchema>;
