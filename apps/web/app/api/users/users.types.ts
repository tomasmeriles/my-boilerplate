import type { PaginationQuery, SortOrder } from '~/lib/types';

export interface UsersQueryParams extends PaginationQuery {
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: SortOrder;
  search?: string;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
}
