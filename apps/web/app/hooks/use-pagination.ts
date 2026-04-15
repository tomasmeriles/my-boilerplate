import { useState } from 'react';

export function usePagination(total: number, limit: number = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    setPage: (p: number) => setPage(Math.min(Math.max(1, p), totalPages)),
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
  };
}
