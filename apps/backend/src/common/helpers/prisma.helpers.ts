import { SortOrder } from '../dto/sort-query.dto';
import type { PaginationQueryDto } from '../dto/pagination-query.dto';
import type { Page } from '../interfaces/page.interface';

/**
 * Useful for building Prisma `where` inputs without verbose
 * `...(x !== undefined && { x })` spreads.
 *
 * @example
 * const where = defined({ userId, action, resource });
 */
export function defined<T extends object>(
  obj: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as { [K in keyof T]: Exclude<T[K], undefined> };
}

/**
 * Builds a Prisma `OR` full-text search filter across multiple string fields.
 * Returns `undefined` when `term` is absent so it spreads safely alongside
 * `defined()` - both treat `undefined` the same way.
 *
 * @example - search only
 * const where = buildSearch(search, ['name', 'email']);
 *
 * @example - combined with exact filters
 * const where = { ...defined({ globalRole }), ...buildSearch(search, ['name', 'email']) };
 * // Returns {} when no term, so it spreads safely without filtering.
 */
export function buildSearch<TField extends string>(
  term: string | undefined,
  fields: readonly TField[],
): { OR?: { [K in TField]?: { contains: string; mode: 'insensitive' } }[] } {
  if (!term) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: term, mode: 'insensitive' as const },
    })) as { [K in TField]?: { contains: string; mode: 'insensitive' } }[],
  };
}

/**
 * Builds a Prisma date range filter `{ gte, lte }`.
 * Returns `undefined` when both bounds are absent so the key
 * can be spread directly into a `where` object - Prisma ignores
 * `undefined` values.
 *
 * @example
 * const where = { ...defined({ userId }), createdAt: dateRange(from, to) };
 */
export function dateRange(
  from?: Date,
  to?: Date,
): { gte?: Date; lte?: Date } | undefined {
  if (from === undefined && to === undefined) return undefined;
  return {
    ...(from !== undefined && { gte: from }),
    ...(to !== undefined && { lte: to }),
  };
}

/**
 * Converts validated `sortBy` / `sortOrder` query params into a Prisma
 * `orderBy` array. Falls back to `defaultOrderBy` when `sortBy` is absent.
 *
 * @example
 * orderBy: toOrderBy(query.sortBy, query.sortOrder, auditLogDefaultOrderBy)
 */
export function toOrderBy<TOrderBy>(
  sortBy: string | undefined,
  sortOrder: SortOrder | undefined,
  defaultOrderBy: TOrderBy[],
): TOrderBy[] {
  if (!sortBy) return defaultOrderBy;
  return [{ [sortBy]: sortOrder ?? SortOrder.DESC }] as TOrderBy[];
}

/**
 * Runs `findMany` and `count` in parallel and returns a typed `Page<T>`.
 * The `where` clause is defined once by the caller and shared between both,
 * so they can never get out of sync.
 *
 * @example
 * return paginate(
 *   query,
 *   () => this.db.user.findMany({ where, skip: query.skip, take: query.limit }),
 *   () => this.db.user.count({ where }),
 * );
 */
export async function paginate<T>(
  query: Pick<PaginationQueryDto, 'page' | 'limit'>,
  findMany: () => Promise<T[]>,
  count: () => Promise<number>,
): Promise<Page<T>> {
  const [data, total] = await Promise.all([findMany(), count()]);
  const totalPages = Math.ceil(total / query.limit);
  return {
    data,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1,
    },
  };
}
