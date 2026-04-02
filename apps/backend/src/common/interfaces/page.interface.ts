export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}
