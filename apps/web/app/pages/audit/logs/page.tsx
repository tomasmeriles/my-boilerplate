import { useState } from 'react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { usePagination } from '~/hooks/use-pagination';
import { useAuditLogs } from '~/hooks/api/use-audit';
import type { AuditAction, AuditQueryParams } from '~/api/audit/audit.types';
import { formatDateTime } from '~/lib/datetime';

const ACTION_OPTIONS: AuditAction[] = [
  'LOGIN',
  'LOGOUT',
  'REGISTER',
  'TOKEN_REVOKED',
  'UPDATE',
  'DELETE',
];

export default function AuditLogsPage() {
  return <AuditLogsTable />;
}

function AuditLogsTable() {
  const [filters, setFilters] = useState<Pick<AuditQueryParams, 'action'>>({});
  const { data, isLoading } = useAuditLogs({ ...filters, limit: 20 });
  const pagination = usePagination(data?.meta.total ?? 0, 20);

  const { data: logs, meta } = data ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <Select
          value={filters.action ?? 'all'}
          onValueChange={(v) =>
            setFilters((prev) => ({
              ...prev,
              action: v === 'all' ? undefined : (v as AuditAction),
            }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && (!logs || logs.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
            {logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline">
                    {log.action.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {log.resource}
                </TableCell>
                <TableCell>
                  {log.success ? (
                    <Badge className="bg-success text-success-foreground">
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.ip ?? '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDateTime(log.createdAt, 'yyyy-MM-dd HH:mm:ss.SSS')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {meta.total} entries · page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={pagination.prevPage}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={pagination.nextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
