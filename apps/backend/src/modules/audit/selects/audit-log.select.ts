import { Prisma } from '@prisma/client';

export const AUDIT_LOG_SORT_FIELDS = [
  'createdAt',
  'action',
  'resource',
  'userId',
] as const;

export type AuditLogSortField = (typeof AUDIT_LOG_SORT_FIELDS)[number];

export const auditLogDefaultOrderBy = [
  { createdAt: 'desc' },
] satisfies Prisma.AuditLogOrderByWithRelationInput[];

export const auditLogSelect = {
  id: true,
  userId: true,
  action: true,
  resource: true,
  resourceId: true,
  ip: true,
  userAgent: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

export type AuditLogPayload = Prisma.AuditLogGetPayload<{
  select: typeof auditLogSelect;
}>;
