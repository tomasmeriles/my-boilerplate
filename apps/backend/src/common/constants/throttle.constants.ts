/**
 * Throttle limit presets for use with @Throttle({ default: THROTTLE.X }).
 * ttl is in milliseconds.
 *
 * Choose the category that best matches the sensitivity of the endpoint:
 *
 *  PUBLIC    - Non-sensitive public reads (e.g. OAuth redirects, health checks)
 *  AUTH      - Authentication flows (e.g. OAuth callback, login)
 *  SENSITIVE - High-risk token or credential operations (e.g. refresh, password reset)
 *  WRITE     - Authenticated mutation endpoints (e.g. create, update, delete)
 *  UPLOAD    - File or bulk data uploads
 */
export const THROTTLE = {
  /** 30 req/min - Non-sensitive public reads */
  PUBLIC: { limit: 30, ttl: 60_000 },
  /** 20 req/min - Authentication flows */
  AUTH: { limit: 20, ttl: 60_000 },
  /** 5 req/min - High-risk token or credential operations */
  SENSITIVE: { limit: 5, ttl: 60_000 },
  /** 60 req/min - Authenticated write operations */
  WRITE: { limit: 60, ttl: 60_000 },
  /** 10 req/min - File or bulk data uploads */
  UPLOAD: { limit: 10, ttl: 60_000 },
} as const;
