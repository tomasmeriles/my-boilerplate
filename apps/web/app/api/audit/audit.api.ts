import { apiClient } from '~/lib/axios';
import type { Page } from '~/lib/types';
import type { AuditLog, AuditQueryParams } from './audit.types';

export const auditApi = {
  getAuditLogs: (params?: AuditQueryParams) =>
    apiClient
      .get<Page<AuditLog>>('/audit/logs', { params })
      .then((r) => r.data),
};
