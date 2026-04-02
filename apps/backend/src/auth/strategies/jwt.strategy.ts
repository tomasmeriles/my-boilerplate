import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../config/services/config.service';
import { UsersService } from '../../modules/users/services/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { SafeUser } from '../../modules/users/selects/user.select';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      // Read the JWT from the httpOnly cookie named "access_token"
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) =>
          (req?.cookies as Record<string, string>)?.['access_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<SafeUser> {
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
