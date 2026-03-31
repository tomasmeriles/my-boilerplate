import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '../config/services/config.service';
import { UsersModule } from '../modules/users/users.module';
import { CaslModule } from '../casl/casl.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    CaslModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        // signOptions are intentionally left empty here because
        // each sign() call passes expiresIn explicitly via AuthService.signAccessToken()
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokensService, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
