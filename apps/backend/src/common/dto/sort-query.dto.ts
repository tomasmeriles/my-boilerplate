import { IsEnum, IsIn, IsOptional } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

type Constructor = new (...args: any[]) => object;

/**
 * Mixin that adds validated `sortBy` and `sortOrder` query params to any DTO.
 * `allowedFields` is the exhaustive list of field names the client may sort by.
 *
 * @example
 * const SORT_FIELDS = ['createdAt', 'action'] as const;
 * export class AuditQueryDto extends WithSort(SORT_FIELDS, PaginationQueryDto) {}
 */
export function WithSort<T extends string, TBase extends Constructor>(
  allowedFields: readonly T[],
  Base: TBase,
) {
  class SortMixin extends Base {
    @IsOptional()
    @IsIn([...allowedFields])
    sortBy?: T;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder;
  }

  return SortMixin;
}
