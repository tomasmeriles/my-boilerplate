import { parseAsInteger, useQueryState } from 'nuqs';

export function useTableState() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  return {
    page,
    onPageChange: (p: number) => void setPage(p),
    resetPage: () => void setPage(1),
  };
}
