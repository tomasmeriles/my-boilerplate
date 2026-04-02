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
