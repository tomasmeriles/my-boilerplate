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
}

export type AuditableRequest = Request & { _audit?: RequestAuditContext };
