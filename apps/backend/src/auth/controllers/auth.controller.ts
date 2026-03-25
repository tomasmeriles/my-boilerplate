import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type User } from '@prisma/client';
import { Request, type Response } from 'express';
import { ConfigService } from '../../config/services/config.service';
import { AuthService } from '../services/auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OAuthUser } from '../interfaces/oauth-user.interface';

const COOKIE_NAME = 'access_token';

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
  @UseGuards(GoogleOAuthGuard)
  googleLogin(): void {
    // Guard handles the redirect; this body never executes.
  }

  /** Handles the OAuth callback, issues JWT, and sets cookie */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(
    @Req() req: Request & { user: OAuthUser },
    @Res() res: Response,
  ): Promise<void> {
    const { accessToken } = await this.auth.handleOAuthLogin(req.user);

    const expirationHours = this.config.get('JWT_EXPIRATION_HOURS');
    res.cookie(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      maxAge: expirationHours * 60 * 60 * 1000,
      path: '/',
    });

    res.redirect(this.config.get('FRONTEND_URL'));
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

  /** Clears the JWT cookie, effectively logging the user out */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }
}
