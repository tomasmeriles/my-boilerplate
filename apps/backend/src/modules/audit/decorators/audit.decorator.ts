import { SetMetadata } from '@nestjs/common';
import { AuditAction, AuditResource } from '@prisma/client';
import { AuditHandlerMetadata } from '../interfaces/audit.interfaces';

export const AUDIT_KEY = 'audit';

export type { AuditHandlerMetadata };

export const Audit = (
  action: AuditAction,
  resource: AuditResource,
): MethodDecorator => SetMetadata(AUDIT_KEY, { action, resource });
