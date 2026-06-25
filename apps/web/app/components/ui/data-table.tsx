import React, { useState } from 'react';
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import { useBreakpoint } from '~/hooks/use-breakpoint';
import { SwipeableRow } from '~/components/gestures/SwipeableRow';
import type { TableAction } from '~/components/ui/table-actions-menu';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    sticky?: boolean;
  }
}
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableFilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select';
  options?: { label: string; value: string }[];
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;

  // Server-side pagination
  pagination?: DataTablePagination;

  // Global search
  search?: DataTableSearch;

  // Column filters (server-side — state managed by parent via URL/useState)
  filters?: DataTableFilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;

  // Server-side sorting (pass to control externally; omit for client-side)
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  // Row selection
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  getRowId?: (row: TData) => string;

  // Expandable rows
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderSubComponent?: (row: Row<TData>) => React.ReactNode;

  // UX
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  emptyMessage?: string;
  emptySlot?: React.ReactNode;
  skeletonRows?: number;
  exportSlot?: React.ReactNode;

  // Mobile card mode — renders a card list instead of a table on xs/sm breakpoints
  mobileCardContent?: (row: TData) => React.ReactNode;
  rowActions?: (row: TData) => TableAction[];
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ChevronUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === 'desc') return <ChevronDown className="ml-1 h-3.5 w-3.5" />;
  return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />;
}

// ─── Page range ───────────────────────────────────────────────────────────────

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  const pages: (number | '...')[] = [1];
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  isLoading = false,
  pagination,
  search,
  filters,
  filterValues = {},
  onFilterChange,
  sorting: sortingProp,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  getRowCanExpand,
  renderSubComponent,
  onRowClick,
  rowClassName,
  emptyMessage = 'No se encontraron resultados.',
  emptySlot,
  skeletonRows = 5,
  exportSlot,
  mobileCardContent,
  rowActions,
}: DataTableProps<TData, TValue>) {
  const breakpoint = useBreakpoint();
  const showMobileCards = (breakpoint === 'xs' || breakpoint === 'sm') && !!mobileCardContent;
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const activeSorting = sortingProp ?? internalSorting;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true,
    manualSorting: !!onSortingChange,
    manualFiltering: true,
    enableRowSelection: !!rowSelection,
    getRowCanExpand,
    getRowId,
    state: {
      sorting: activeSorting,
      rowSelection: rowSelection ?? {},
    },
    onSortingChange: (updaterOrValue) => {
      const newSorting = functionalUpdate(updaterOrValue, activeSorting);
      if (onSortingChange) {
        onSortingChange(newSorting);
      } else {
        setInternalSorting(newSorting);
      }
    },
    onRowSelectionChange: onRowSelectionChange as Parameters<typeof useReactTable>[0]['onRowSelectionChange'],
    pageCount: pagination ? Math.ceil(pagination.total / pagination.pageSize) : undefined,
  });

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;
  const selectedCount = rowSelection ? Object.keys(rowSelection).filter((k) => rowSelection[k]).length : 0;
  const hasToolbar = search || (filters && filters.length > 0) || exportSlot;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-3">
          {search && (
            <Input
              placeholder={search.placeholder ?? 'Buscar…'}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className="max-w-xs"
            />
          )}
          {filters?.map((filter) =>
            filter.type === 'select' ? (
              <Select
                key={filter.key}
                value={filterValues[filter.key] || '__all__'}
                onValueChange={(v) => onFilterChange?.(filter.key, v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {filter.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                key={filter.key}
                placeholder={filter.label}
                value={filterValues[filter.key] ?? ''}
                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                className="max-w-xs"
              />
            ),
          )}
          {exportSlot && <div className="ml-auto flex items-center gap-2">{exportSlot}</div>}
        </div>
      )}

      {/* Selection count */}
      {selectedCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedCount} fila{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* Mobile card list */}
      {showMobileCards && (
        <div className="divide-y rounded-md border">
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <div key={i} className="p-3">
                <Skeleton className="h-12 w-full" />
              </div>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <div className={emptySlot ? 'p-0' : 'py-12 text-center text-sm text-muted-foreground'}>
              {emptySlot ?? emptyMessage}
            </div>
          ) : (
            table.getRowModel().rows.map((row) => (
              <SwipeableRow
                key={row.id}
                actions={rowActions ? rowActions(row.original) : []}
              >
                <div
                  className={cn('p-3', onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {mobileCardContent!(row.original)}
                </div>
              </SwipeableRow>
            ))
          )}
        </div>
      )}

      {/* Desktop table */}
      {!showMobileCards && <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-primary hover:bg-primary border-primary">
                {rowSelection && (
                  <TableHead className="w-10 px-3 text-primary-foreground">
                    <Checkbox
                      checked={
                        table.getIsAllPageRowsSelected()
                          ? true
                          : table.getIsSomePageRowsSelected()
                          ? 'indeterminate'
                          : false
                      }
                      onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                )}
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-primary-foreground',
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.sticky && 'sticky left-0 z-20 bg-primary',
                    )}
                    style={header.column.getSize() !== 150 ? { width: header.column.getSize() } : undefined}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className={cn(
                          'flex items-center w-full font-medium text-primary-foreground hover:text-primary-foreground/80 transition-colors',
                          header.column.columnDef.meta?.className?.includes('text-right')
                            ? 'justify-end'
                            : 'justify-start',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon direction={header.column.getIsSorted()} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i}>
                  {rowSelection && (
                    <TableCell className="w-10 px-3">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowSelection ? 1 : 0)}
                  className={emptySlot ? 'p-0' : 'py-12 text-center text-sm text-muted-foreground'}
                >
                  {emptySlot ?? emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row.original))}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {rowSelection && (
                      <TableCell
                        className="w-10 px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={row.getToggleSelectedHandler()}
                          aria-label="Seleccionar fila"
                        />
                      </TableCell>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.className,
                          cell.column.columnDef.meta?.sticky && 'sticky left-0 z-10 bg-background',
                        )}
                        style={cell.column.getSize() !== 150 ? { width: cell.column.getSize() } : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderSubComponent && row.getIsExpanded() && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + (rowSelection ? 1 : 0)}
                        className="p-0"
                      >
                        {renderSubComponent(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {pagination.total} registro{pagination.total !== 1 ? 's' : ''} · página {pagination.page} de{' '}
            {totalPages}
          </span>
          <div className="flex items-center gap-1">
            {buildPageRange(pagination.page, totalPages).map((page, i) =>
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground select-none">
                  …
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === pagination.page ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 px-0"
                  disabled={isLoading}
                  onClick={() => pagination.onPageChange(page)}
                >
                  {page}
                </Button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
