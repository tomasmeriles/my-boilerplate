import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';
import type { ServerResponse } from 'http';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/services/config.service';
import { HealthModule } from './health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './modules/audit/interceptors/audit.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const id =
              (req.headers['x-request-id'] as string | undefined) ??
              randomUUID();
            res.setHeader('X-Request-ID', id);
            return id;
          },
          transport: config.isDevelopment
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
          level: config.isTest
            ? 'silent'
            : config.isDevelopment
              ? 'debug'
              : 'info',
        },
      }),
    }),
    PrismaModule,
    UsersModule,
    AuditModule,
    AuthModule,
    HealthModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL_SECONDS') * 1000,
            limit: config.get('THROTTLE_LIMIT'),
          },
        ],
      }),
    }),
  ],
  controllers: [],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
