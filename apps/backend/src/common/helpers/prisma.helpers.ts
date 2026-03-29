import { SortOrder } from '../dto/sort-query.dto';

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
 * Builds a Prisma date range filter `{ gte, lte }`.
 * Returns `undefined` when both bounds are absent so the key
 * can be spread directly into a `where` object — Prisma ignores
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
 * Builds the full args object for a Prisma `findMany` call.
 * Pass the result directly; reuse `args.where` in the paired `count`.
 *
 * @example
 * const args = buildFindManyArgs({
 *   select: auditLogSelect,
 *   where: { ...defined({ userId }), createdAt: dateRange(from, to) },
 *   orderBy: auditLogDefaultOrderBy,
 *   pagination: query,
 * });
 * const [data, total] = await prisma.$transaction([
 *   prisma.auditLog.findMany(args),
 *   prisma.auditLog.count({ where: args.where }),
 * ]);
 */
export function buildFindManyArgs<TSelect, TWhere, TOrderBy>(opts: {
  select?: TSelect;
  where?: TWhere;
  orderBy?: TOrderBy | TOrderBy[];
  pagination?: { skip: number; limit: number };
}): {
  select?: TSelect;
  where?: TWhere;
  orderBy?: TOrderBy | TOrderBy[];
  skip: number | undefined;
  take: number | undefined;
} {
  const { select, where, orderBy, pagination } = opts;
  return {
    select,
    where,
    orderBy,
    skip: pagination?.skip,
    take: pagination?.limit,
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
