import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CsrfGuard } from './auth/guards/csrf.guard';
import { PoliciesGuard } from './casl/guards/policies.guard';
import { CaslModule } from './casl/casl.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const id = req.headers['x-request-id'] ?? randomUUID();
            res.setHeader('X-Request-ID', id);
            return id;
          },
          transport: config.isDevelopment
            ? {
                target: 'pino-pretty',
                // pino-pretty options: singleLine for easier parsing, ignore req/res to avoid logging them entirely
                // (they can be very large and contain sensitive info)
                options: { singleLine: true, ignore: 'req,res' },
              }
            : undefined,
          level: config.get('LOG_LEVEL'),
        },
      }),
    }),
    PrismaModule,
    UsersModule,
    AuditModule,
    AuthModule,
    CaslModule,
    QueueModule,
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
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
