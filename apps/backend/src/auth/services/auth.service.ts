import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { DateTime } from 'luxon';
import { UsersService } from '../../modules/users/services/users.service';
import { RefreshTokensService } from './refresh-tokens.service';
import { ConfigService } from '../../config/services/config.service';
import { OAuthUser } from '../interfaces/oauth-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenPair } from '../interfaces/token-pair.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly refreshTokens: RefreshTokensService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Upserts the user coming from an OAuth provider and issues a token pair.
   */
  async handleOAuthLogin(
    oauthUser: OAuthUser,
  ): Promise<{ tokens: TokenPair; user: User }> {
    const user = await this.users.upsertOAuthUser(oauthUser);
    const tokens = await this.issueTokenPair(user);
    return { tokens, user };
  }

  /**
   * Validates a refresh token, rotates it, and issues a new token pair.
   */
  async refreshTokenPair(
    refreshToken: string,
  ): Promise<{ tokens: TokenPair; userId: string }> {
    const record = await this.refreshTokens.consume(refreshToken);

    const newRefreshToken = this.refreshTokens.generate();
    const expiresAt = this.refreshExpiresAt();

    await this.refreshTokens.rotate(
      refreshToken,
      newRefreshToken,
      record.userId,
      expiresAt,
    );

    const accessToken = this.signAccessToken(record.user);
    return {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        refreshMaxAge: this.refreshMaxAgeMs(),
      },
      userId: record.userId,
    };
  }

  /**
   * Revokes the given refresh token (logout) and returns the owner's userId.
   */
  revokeRefreshToken(refreshToken: string): Promise<string | null> {
    return this.refreshTokens.revoke(refreshToken);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const refreshToken = this.refreshTokens.generate();
    const expiresAt = this.refreshExpiresAt();
    await this.refreshTokens.store(refreshToken, user.id, expiresAt);

    const accessToken = this.signAccessToken(user);
    return { accessToken, refreshToken, refreshMaxAge: this.refreshMaxAgeMs() };
  }

  private signAccessToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const minutes = this.config.get('JWT_ACCESS_EXPIRES_MINUTES');
    return this.jwt.sign(payload, { expiresIn: `${minutes}m` });
  }

  private refreshExpiresAt(): Date {
    const days = this.config.get('JWT_REFRESH_EXPIRES_DAYS');
    return DateTime.utc().plus({ days }).toJSDate();
  }

  private refreshMaxAgeMs(): number {
    const days = this.config.get('JWT_REFRESH_EXPIRES_DAYS');
    return days * 24 * 60 * 60 * 1000;
  }
}
