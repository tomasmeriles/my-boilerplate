import { AuditAction, AuditResource, Prisma } from '@prisma/client';
import type { Request } from 'express';

export interface AuditHandlerMetadata {
  action: AuditAction;
  resource: AuditResource;
}

export interface RequestAuditContext {
  userId?: string | null;
  resourceId?: string | null;
  requestId?: string;
  metadata?: Prisma.InputJsonValue;
  /**
   * When true the interceptor will NOT write a failure audit log for this
   * request. Use this for expected/benign error paths (e.g. calling
   * /auth/refresh with no cookie present) that should not pollute the log.
   */
  skipAuditOnError?: boolean;
}

export type AuditableRequest = Request & { _audit?: RequestAuditContext };
