import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import type { SortingState } from '@tanstack/react-table';

export interface UseTableSortOptions {
  onSortChange?: () => void;
}

export function useTableSort(options: UseTableSortOptions = {}) {
  const [{ sortBy, sortDir }, setSort] = useQueryStates({
    sortBy: parseAsString,
    sortDir: parseAsStringLiteral(['asc', 'desc'] as const),
  });

  const sorting: SortingState = sortBy
    ? [{ id: sortBy, desc: sortDir === 'desc' }]
    : [];

  function onSortingChange(next: SortingState) {
    if (!next.length) {
      void setSort({ sortBy: null, sortDir: null });
    } else {
      const col = next[0]!;
      void setSort({ sortBy: col.id, sortDir: col.desc ? 'desc' : 'asc' });
    }
    options.onSortChange?.();
  }

  return {
    sorting,
    onSortingChange,
    sortBy: sortBy ?? undefined,
    sortDir: (sortDir ?? undefined) as 'asc' | 'desc' | undefined,
  };
}
