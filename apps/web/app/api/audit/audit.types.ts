import type { PaginationQuery, SortOrder } from '~/lib/types';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOKEN_REVOKED'
  | 'REGISTER'
  | 'UPDATE'
  | 'DELETE';

export type AuditResource = 'USER' | 'SESSION' | 'OAUTH_ACCOUNT';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string | null;
  requestId: string | null;
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditQueryParams extends PaginationQuery {
  sortBy?: 'createdAt' | 'action' | 'resource' | 'userId';
  sortOrder?: SortOrder;
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  from?: string;
  to?: string;
  timezone?: string;
}
