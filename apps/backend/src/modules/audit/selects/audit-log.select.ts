import { Prisma } from '@prisma/client';

export const auditLogSelect = {
  id: true,
  userId: true,
  action: true,
  resource: true,
  resourceId: true,
  requestId: true,
  success: true,
  ip: true,
  userAgent: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

export type AuditLogPayload = Prisma.AuditLogGetPayload<{
  select: typeof auditLogSelect;
}>;
