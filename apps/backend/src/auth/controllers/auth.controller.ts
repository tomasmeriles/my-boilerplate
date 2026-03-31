import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuditAction, AuditResource, type User } from '@prisma/client';
import type { Response } from 'express';
import { ConfigService } from '../../config/services/config.service';
import { Audit } from '../../modules/audit/decorators/audit.decorator';
import type { AuditableRequest } from '../../modules/audit/interceptors/audit.interceptor';
import { AuthService } from '../services/auth.service';
import { Cookie } from '../decorators/cookie.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OAuthUser } from '../interfaces/oauth-user.interface';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // -----------------------------------------------------------------------
  // Google OAuth flow
  // -----------------------------------------------------------------------

  /** Redirects the browser to Google's consent screen */
  @Get('google')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(GoogleOAuthGuard)
  googleLogin(): void {
    // Guard handles the redirect; this body never executes.
  }

  /** Handles the OAuth callback, issues JWT pair, and sets cookies */
  @Get('google/callback')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(GoogleOAuthGuard)
  @Audit(AuditAction.LOGIN, AuditResource.USER)
  async googleCallback(
    @Req() req: AuditableRequest & { user: OAuthUser },
    @Res() res: Response,
  ): Promise<void> {
    const { tokens, user } = await this.auth.handleOAuthLogin(req.user);
    req._audit = { userId: user.id, metadata: { provider: req.user.provider } };
    this.setTokenCookies(
      res,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.refreshMaxAge,
    );
    res.redirect(this.config.get('FRONTEND_URL'));
  }

  // -----------------------------------------------------------------------
  // Token management
  // -----------------------------------------------------------------------

  /** Issues a new access + refresh token pair using the refresh token cookie */
  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit(AuditAction.TOKEN_REFRESH, AuditResource.SESSION)
  async refresh(
    @Cookie(REFRESH_COOKIE) refreshToken: string | undefined,
    @Req() req: AuditableRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { tokens, userId } = await this.auth.refreshTokenPair(refreshToken);
    req._audit = { userId };
    this.setTokenCookies(
      res,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.refreshMaxAge,
    );
  }

  // -----------------------------------------------------------------------
  // Session endpoints
  // -----------------------------------------------------------------------

  /** Returns the currently authenticated user (requires valid JWT cookie) */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User): Omit<User, 'updatedAt'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt: _omit, ...safeUser } = user;
    return safeUser;
  }

  /** Revokes the refresh token and clears both cookies */
  @Post('logout')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit(AuditAction.LOGOUT, AuditResource.SESSION)
  async logout(
    @Cookie(REFRESH_COOKIE) refreshToken: string | undefined,
    @Req() req: AuditableRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    let userId: string | null = null;
    if (refreshToken) {
      userId = await this.auth.revokeRefreshToken(refreshToken);
    }
    req._audit = { userId };
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    refreshMaxAge: number,
  ): void {
    const isProduction = this.config.isProduction;
    const accessMinutes = this.config.get('JWT_ACCESS_EXPIRES_MINUTES');

    res.cookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: accessMinutes * 60 * 1000,
      path: '/',
    });

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: refreshMaxAge,
      path: '/auth/refresh', // scoped - only sent to the refresh endpoint
    });
  }
}
