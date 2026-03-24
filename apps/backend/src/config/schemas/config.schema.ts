import { z } from 'zod';

export const configSchema = z.object({
  // Critical variables (no default, must be provided)
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Optional variables with defaults
  PORT: z.coerce.number().default(3000),
});

export type AppConfig = z.infer<typeof configSchema>;
