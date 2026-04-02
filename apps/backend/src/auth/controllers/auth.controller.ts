import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuditAction, AuditResource, type User } from '@prisma/client';
import type { Response } from 'express';
import { THROTTLE } from '../../common/constants/throttle.constants';
import { Audit } from '../../modules/audit/decorators/audit.decorator';
import type { AuditableRequest } from '../../modules/audit/interceptors/audit.interceptor';
import { AuthService } from '../services/auth.service';
import { Cookie } from '../decorators/cookie.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { OAuthUser } from '../interfaces/oauth-user.interface';
import type { PackedAbility } from '../../casl/interfaces/ability.interface';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // -----------------------------------------------------------------------
  // Google OAuth flow
  // -----------------------------------------------------------------------

  /** Redirects the browser to Google's consent screen */
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @Public()
  @Throttle({ default: THROTTLE.AUTH })
  @UseGuards(GoogleOAuthGuard)
  googleLogin(): void {
    // Guard handles the redirect; this body never executes.
  }

  /** Handles the OAuth callback, issues JWT pair, and sets cookies */
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback - sets auth cookies' })
  @Public()
  @Throttle({ default: THROTTLE.AUTH })
  @UseGuards(GoogleOAuthGuard)
  @Audit(AuditAction.LOGIN, AuditResource.USER)
  async googleCallback(
    @Req() req: AuditableRequest & { user: OAuthUser },
    @Res() res: Response,
  ): Promise<void> {
    const { tokens, user } = await this.auth.handleOAuthLogin(req.user);
    req._audit = { userId: user.id, metadata: { provider: req.user.provider } };
    res.cookie(
      ACCESS_COOKIE,
      tokens.accessToken,
      this.auth.accessCookieOptions(),
    );
    res.cookie(
      REFRESH_COOKIE,
      tokens.refreshToken,
      this.auth.refreshCookieOptions(tokens.refreshMaxAge),
    );
    res.redirect(this.auth.frontendUrl());
  }

  /** Issues a new access + refresh token pair using the refresh token cookie */
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate access + refresh token pair' })
  @ApiCookieAuth('access_token')
  @ApiNoContentResponse({ description: 'Tokens rotated - new cookies set' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid refresh token' })
  @Public()
  @Throttle({ default: THROTTLE.SENSITIVE })
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
    res.cookie(
      ACCESS_COOKIE,
      tokens.accessToken,
      this.auth.accessCookieOptions(),
    );
    res.cookie(
      REFRESH_COOKIE,
      tokens.refreshToken,
      this.auth.refreshCookieOptions(tokens.refreshMaxAge),
    );
  }

  // -----------------------------------------------------------------------
  // Session endpoints
  // -----------------------------------------------------------------------

  /** Returns the current user plus CASL abilities scoped to the given tenant */
  @Get('me')
  @ApiOperation({ summary: 'Get current user and abilities' })
  @ApiCookieAuth('access_token')
  @ApiOkResponse({ description: 'Current user profile with abilities' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @SkipThrottle()
  getMe(
    @CurrentUser() user: User,
    @Headers('x-tenant-id') tenantId: string | undefined,
  ): Promise<{ user: Omit<User, 'updatedAt'>; abilities: PackedAbility[] }> {
    return this.auth.getMe(user, tenantId ?? null);
  }

  /** Revokes the refresh token and clears both cookies */
  @Post('logout')
  @ApiOperation({ summary: 'Revoke refresh token and clear auth cookies' })
  @ApiCookieAuth('access_token')
  @ApiNoContentResponse({ description: 'Session revoked' })
  @SkipThrottle()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit(AuditAction.LOGOUT, AuditResource.SESSION)
  async logout(
    @Cookie(REFRESH_COOKIE) refreshToken: string | undefined,
    @Req() req: AuditableRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const userId = await this.auth.logout(refreshToken);
    req._audit = { userId };
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }
}
