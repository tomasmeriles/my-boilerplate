import {
  Body,
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
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuditAction, AuditResource } from '@prisma/client';
import type { Response } from 'express';
import { THROTTLE } from '../../common/constants/throttle.constants';
import { Audit } from '../../modules/audit/decorators/audit.decorator';
import type { AuditableRequest } from '../../modules/audit/interceptors/audit.interceptor';
import { AuthService } from '../services/auth.service';
import { Cookie } from '../decorators/cookie.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { OAuthUser } from '../interfaces/oauth-user.interface';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import type { PackedAbility } from '../../casl/interfaces/ability.interface';
import type { SafeUser } from '../../modules/users/selects/user.select';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const CSRF_COOKIE = 'csrf_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // -----------------------------------------------------------------------
  // Local auth flow
  // -----------------------------------------------------------------------

  /** Registers a new user with email + password and issues a token pair */
  @Post('register')
  @ApiOperation({ summary: 'Register with email and password' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'User created - auth cookies set' })
  @Public()
  @Throttle({ default: THROTTLE.AUTH })
  @Audit(AuditAction.REGISTER, AuditResource.USER)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: AuditableRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: SafeUser; csrfToken: string }> {
    const { tokens, user } = await this.auth.register(dto);
    req._audit = { userId: user.id };
    const csrfToken = this.auth.generateCsrfToken();
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
    res.cookie(
      CSRF_COOKIE,
      csrfToken,
      this.auth.csrfCookieOptions(tokens.refreshMaxAge),
    );
    return { user, csrfToken };
  }

  /** Authenticates an existing user with email + password and issues a token pair */
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({ description: 'Authenticated - auth cookies set' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: THROTTLE.AUTH })
  @Audit(AuditAction.LOGIN, AuditResource.USER)
  async login(
    @Req() req: AuditableRequest & { user: SafeUser },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: SafeUser; csrfToken: string }> {
    const { tokens, user } = await this.auth.loginWithPassword(req.user);
    req._audit = { userId: user.id, metadata: { provider: 'local' } };
    const csrfToken = this.auth.generateCsrfToken();
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
    res.cookie(
      CSRF_COOKIE,
      csrfToken,
      this.auth.csrfCookieOptions(tokens.refreshMaxAge),
    );
    return { user, csrfToken };
  }

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
    res.cookie(
      CSRF_COOKIE,
      this.auth.generateCsrfToken(),
      this.auth.csrfCookieOptions(tokens.refreshMaxAge),
    );
    res.redirect(this.auth.frontendUrl());
  }

  /** Issues a new access + refresh token pair using the refresh token cookie */
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate access + refresh token pair' })
  @ApiCookieAuth('access_token')
  @ApiOkResponse({
    description: 'Tokens rotated - new cookies set, csrfToken in body',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid refresh token' })
  @Public()
  @Throttle({ default: THROTTLE.SENSITIVE })
  async refresh(
    @Cookie(REFRESH_COOKIE) refreshToken: string | undefined,
    @Req() req: AuditableRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ csrfToken: string }> {
    if (!refreshToken) {
      // Mark as non-auditable: no cookie means the caller was never
      // authenticated (e.g. Axios refresh interceptor fired on an anonymous
      // request). This is not a security event worth recording.
      req._audit = { skipAuditOnError: true };
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      const { tokens, userId } = await this.auth.refreshTokenPair(refreshToken);
      req._audit = { userId };
      const csrfToken = this.auth.generateCsrfToken();
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
      res.cookie(
        CSRF_COOKIE,
        csrfToken,
        this.auth.csrfCookieOptions(tokens.refreshMaxAge),
      );
      return { csrfToken };
    } catch (err) {
      // Clear stale cookies so the browser doesn't retry forever with an
      // invalid token (e.g. after a DB reset or a broken rotation chain).
      res.clearCookie(ACCESS_COOKIE, { path: '/' });
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // Session endpoints
  // -----------------------------------------------------------------------

  /**
   * Issues a fresh signed CSRF token and sets the csrf_token cookie.
   * Must be called after an OAuth redirect (where csrfToken is not in the
   * body) and on page reload before making any state-changing request.
   * Requires a valid access_token cookie (protected route).
   */
  @Get('csrf-token')
  @ApiOperation({ summary: 'Get a fresh signed CSRF token' })
  @ApiCookieAuth('access_token')
  @ApiOkResponse({ description: 'Fresh CSRF token issued' })
  @SkipThrottle()
  csrfToken(@Res({ passthrough: true }) res: Response): { csrfToken: string } {
    const maxAge = this.auth.refreshMaxAgeMs();
    const csrfToken = this.auth.generateCsrfToken();
    res.cookie(CSRF_COOKIE, csrfToken, this.auth.csrfCookieOptions(maxAge));
    return { csrfToken };
  }

  /** Returns the current user plus CASL abilities scoped to the given tenant */
  @Get('me')
  @ApiOperation({ summary: 'Get current user and abilities' })
  @ApiCookieAuth('access_token')
  @ApiOkResponse({ description: 'Current user profile with abilities' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @SkipThrottle()
  getMe(
    @CurrentUser() user: SafeUser,
    @Headers('x-tenant-id') tenantId: string | undefined,
  ): Promise<{ user: SafeUser; abilities: PackedAbility[] }> {
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
    res.clearCookie(CSRF_COOKIE, { path: '/' });
  }
}
