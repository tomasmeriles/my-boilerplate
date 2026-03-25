import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from '../../modules/users/services/users.service';
import { ConfigService } from '../../config/services/config.service';
import { OAuthUser } from '../interfaces/oauth-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Upserts the user coming from an OAuth provider and returns a signed JWT.
   */
  async handleOAuthLogin(
    oauthUser: OAuthUser,
  ): Promise<{ accessToken: string; user: User }> {
    const user = await this.users.upsertOAuthUser(oauthUser);
    const accessToken = this.signToken(user);
    return { accessToken, user };
  }

  signToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const expirationHours = this.config.get('JWT_EXPIRATION_HOURS');
    return this.jwt.sign(payload, { expiresIn: `${expirationHours}h` });
  }
}
