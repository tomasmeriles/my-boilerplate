import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { DateTime } from 'luxon';
import type { CookieOptions } from 'express';
import { UsersService } from '../../modules/users/services/users.service';
import type { SafeUser } from '../../modules/users/selects/user.select';
import { RefreshTokensService } from './refresh-tokens.service';
import { ConfigService } from '../../config/services/config.service';
import type { OAuthUser } from '../interfaces/oauth-user.interface';
import type { RegisterDto } from '../dto/register.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenPair } from '../interfaces/token-pair.interface';
import { PasswordService } from './password.service';
import { CaslAbilityFactory } from '../../casl/factories/casl-ability.factory';
import { AbilityCacheService } from '../../casl/services/ability-cache.service';
import type { PackedAbility } from '../../casl/interfaces/ability.interface';
import { TransactionalService } from '../../common/base/transactional-service.base';
import { Transactional } from '../../common/decorators/transactional.decorator';

@Injectable()
export class AuthService extends TransactionalService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly refreshTokens: RefreshTokensService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly abilityFactory: CaslAbilityFactory,
    private readonly abilityCache: AbilityCacheService,
    private readonly password: PasswordService,
  ) {
    super();
  }

  /**
   * Upserts the user coming from an OAuth provider and issues a token pair.
   */
  @Transactional()
  async handleOAuthLogin(
    oauthUser: OAuthUser,
  ): Promise<{ tokens: TokenPair; user: SafeUser }> {
    const user = await this.users.upsertOAuthUser(oauthUser);
    const tokens = await this.issueTokenPair(user);
    return { tokens, user };
  }

  /**
   * Registers a new local user, hashes the password, and issues a token pair.
   * Throws ConflictException if the email is already taken.
   */
  @Transactional()
  async register(
    dto: RegisterDto,
  ): Promise<{ tokens: TokenPair; user: SafeUser }> {
    const passwordHash = await this.password.hash(dto.password);
    const user = await this.users.createLocalUser({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    const tokens = await this.issueTokenPair(user);
    return { tokens, user };
  }

  /**
   * Validates email + password credentials. Returns the SafeUser or null.
   * Used by LocalStrategy.
   */
  async validateLocalUser(
    email: string,
    plain: string,
  ): Promise<SafeUser | null> {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user || !user.passwordHash) return null;

    const valid = await this.password.verify(plain, user.passwordHash);

    if (!valid) return null;

    // TODO: Enable email verification flow and remove this bypass
    // if (!user.emailVerifiedAt) {
    //   throw new ForbiddenException('Email not verified');
    // }

    // Strip passwordHash before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Issues a token pair for an already-validated local user (post-login).
   */
  @Transactional()
  async loginWithPassword(
    user: SafeUser,
  ): Promise<{ tokens: TokenPair; user: SafeUser }> {
    const tokens = await this.issueTokenPair(user);

    return { tokens, user };
  }

  /**
   * Validates a refresh token, rotates it, and issues a new token pair.
   */
  @Transactional()
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
  @Transactional()
  revokeRefreshToken(refreshToken: string): Promise<string | null> {
    return this.refreshTokens.revoke(refreshToken);
  }

  /**
   * Revokes the refresh token, invalidates the ability cache, and returns the userId.
   */
  @Transactional()
  async logout(refreshToken: string | undefined): Promise<string | null> {
    if (!refreshToken) return null;
    const userId = await this.refreshTokens.revoke(refreshToken);
    if (userId) await this.abilityCache.delAll(userId);
    return userId;
  }

  /**
   * Returns the current user profile and their CASL abilities for the given tenant.
   * Uses Redis cache; falls back to DB if not cached.
   */
  async getMe(
    user: SafeUser,
    tenantId: string | null,
  ): Promise<{ user: SafeUser; abilities: PackedAbility[] }> {
    let abilities = await this.abilityCache.get(user.id, tenantId);

    if (!abilities) {
      const userWithMemberships = await this.users.findWithMemberships(user.id);
      if (userWithMemberships) {
        const built = this.abilityFactory.buildAbilities(
          userWithMemberships,
          tenantId,
        );
        abilities = built.rules;
        await this.abilityCache.set(user.id, tenantId, abilities);
      } else {
        abilities = [];
      }
    }

    return { user, abilities };
  }

  /** Cookie options for the access token */
  accessCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? 'none' : 'lax',
      maxAge: this.config.get('JWT_ACCESS_EXPIRES_MINUTES') * 60 * 1000,
      path: '/',
      ...(this.config.get('COOKIE_DOMAIN') && {
        domain: this.config.get('COOKIE_DOMAIN'),
      }),
    };
  }

  /** Cookie options for the refresh token */
  refreshCookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? 'none' : 'lax',
      maxAge,
      path: '/',
      ...(this.config.get('COOKIE_DOMAIN') && {
        domain: this.config.get('COOKIE_DOMAIN'),
      }),
    };
  }

  /**
   * Cookie options for the CSRF double-submit token.
   * Non-httpOnly so the frontend JS can read and forward it as a header.
   */
  csrfCookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: false,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? 'none' : 'lax',
      maxAge,
      path: '/',
      ...(this.config.get('COOKIE_DOMAIN') && {
        domain: this.config.get('COOKIE_DOMAIN'),
      }),
    };
  }

  /**
   * Generates a signed CSRF token using HMAC-SHA256.
   * Format: `<random>.<signature>` where signature = HMAC(CSRF_SECRET, random).
   * Even if an attacker injects an arbitrary cookie value they cannot
   * produce a valid signature without knowing CSRF_SECRET.
   */
  generateCsrfToken(): string {
    const random = randomBytes(32).toString('hex');
    const secret = this.config.get('CSRF_SECRET');
    const signature = createHmac('sha256', secret).update(random).digest('hex');
    return `${random}.${signature}`;
  }

  /** Frontend URL for post-login redirect */
  frontendUrl(): string {
    return this.config.get('FRONTEND_URL');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async issueTokenPair(user: SafeUser): Promise<TokenPair> {
    const refreshToken = this.refreshTokens.generate();
    const expiresAt = this.refreshExpiresAt();
    await this.refreshTokens.store(refreshToken, user.id, expiresAt);

    const accessToken = this.signAccessToken(user);
    return { accessToken, refreshToken, refreshMaxAge: this.refreshMaxAgeMs() };
  }

  private signAccessToken(user: SafeUser): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const minutes = this.config.get('JWT_ACCESS_EXPIRES_MINUTES');
    return this.jwt.sign(payload, { expiresIn: `${minutes}m` });
  }

  private refreshExpiresAt(): Date {
    const days = this.config.get('JWT_REFRESH_EXPIRES_DAYS');
    return DateTime.utc().plus({ days }).toJSDate();
  }

  refreshMaxAgeMs(): number {
    const days = this.config.get('JWT_REFRESH_EXPIRES_DAYS');
    return days * 24 * 60 * 60 * 1000;
  }
}
