import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Initiates the Google OAuth 2.0 redirect flow.
 * Apply to the `/auth/google` endpoint.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {}
