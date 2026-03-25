import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects routes that require a valid JWT stored in the `access_token` cookie.
 * Apply to any endpoint that needs an authenticated user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
