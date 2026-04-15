import { useQuery } from '@tanstack/react-query';
import { auditApi } from '~/api/audit/audit.api';
import type { AuditQueryParams } from '~/api/audit/audit.types';

export const auditKeys = {
  all: ['audit'] as const,
  logs: (params?: AuditQueryParams) =>
    [...auditKeys.all, 'logs', params] as const,
};

export function useAuditLogs(params?: AuditQueryParams) {
  return useQuery({
    queryKey: auditKeys.logs(params),
    queryFn: () => auditApi.getAuditLogs(params),
  });
}
