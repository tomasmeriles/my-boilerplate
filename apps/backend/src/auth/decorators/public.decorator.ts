import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public, bypassing the global JwtAuthGuard.
 * Use on any endpoint that does not require authentication.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
