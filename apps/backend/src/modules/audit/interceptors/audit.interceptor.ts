import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, AuditHandlerMetadata } from '../decorators/audit.decorator';
import {
  AuditableRequest,
  RequestAuditContext,
} from '../interfaces/audit.interfaces';
import { AuditService } from '../services/audit.service';

export type { AuditableRequest, RequestAuditContext };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly audit: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditHandlerMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest<
      Request & {
        id?: string;
        user?: { id?: string };
        _audit?: RequestAuditContext;
      }
    >();

    return next.handle().pipe(
      tap({
        next: () => {
          const userId = req._audit?.userId ?? req.user?.id ?? null;
          void this.audit
            .log({
              userId,
              action: meta.action,
              resource: meta.resource,
              resourceId: req._audit?.resourceId ?? userId,
              requestId: req._audit?.requestId ?? req.id,
              success: true,
              ip: this.extractIp(req),
              userAgent: req.headers['user-agent'],
              metadata: req._audit?.metadata,
            })
            .catch((err: unknown) => {
              this.logger.error(
                `Failed to write audit log: ${
                  err instanceof Error ? err.message : String(err)
                }`,
                err instanceof Error ? err.stack : undefined,
              );
            });
        },
        error: (err: unknown) => {
          if (req._audit?.skipAuditOnError) return;
          const userId = req._audit?.userId ?? req.user?.id ?? null;
          void this.audit
            .log({
              userId,
              action: meta.action,
              resource: meta.resource,
              resourceId: req._audit?.resourceId ?? userId,
              requestId: req._audit?.requestId ?? req.id,
              success: false,
              ip: this.extractIp(req),
              userAgent: req.headers['user-agent'],
              metadata: this.extractErrorMetadata(err),
            })
            .catch((auditErr: unknown) => {
              this.logger.error(
                `Failed to write failure audit log: ${
                  auditErr instanceof Error
                    ? auditErr.message
                    : String(auditErr)
                }`,
                auditErr instanceof Error ? auditErr.stack : undefined,
              );
            });
        },
      }),
    );
  }

  private extractIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    return (
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : undefined) ?? req.ip
    );
  }

  private extractErrorMetadata(err: unknown): Record<string, string> {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { errorCode: err.code, errorType: 'PrismaKnownRequestError' };
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
      return { errorType: 'PrismaValidationError' };
    }
    if (err instanceof Error) {
      return { errorType: err.name, errorMessage: err.message };
    }
    return { errorType: 'UnknownError' };
  }
}
