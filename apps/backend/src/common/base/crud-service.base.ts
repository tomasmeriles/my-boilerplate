import { NotFoundException } from '@nestjs/common';
import { Transactional } from '../decorators/transactional.decorator';
import { paginate } from '../helpers/prisma.helpers';
import type { Page } from '../interfaces/page.interface';
import type { PaginationQueryDto } from '../dto/pagination-query.dto';
import { TransactionalService } from './transactional-service.base';

/**
 * Structural interface that matches any Prisma model delegate used by CrudService.
 * Subclasses cast `this.db.<model>` to this type via `as unknown as CrudDelegate<…>`.
 *
 * Type params mirror the CrudService type params:
 *  - TList    - shape returned by findAll (uses listSelect)
 *  - TDetail  - shape returned by findById / create / update / delete (uses detailSelect)
 *  - TCreate  - Prisma CreateInput for this model
 *  - TUpdate  - Prisma UpdateInput for this model
 *  - TWhere   - Prisma WhereInput for this model (used for filtering in findAll)
 */
export interface CrudDelegate<TList, TDetail, TCreate, TUpdate, TWhere> {
  findMany(args: {
    select: unknown;
    where?: TWhere;
    orderBy?: unknown;
    skip?: number;
    take?: number;
  }): Promise<TList[]>;

  findUnique(args: {
    select: unknown;
    where: { id: string };
  }): Promise<TDetail | null>;

  create(args: { data: TCreate; select: unknown }): Promise<TDetail>;

  update(args: {
    where: { id: string };
    data: TUpdate;
    select: unknown;
  }): Promise<TDetail>;

  delete(args: { where: { id: string }; select: unknown }): Promise<unknown>;

  count(args?: { where?: TWhere }): Promise<number>;
}

/**
 * Generic CRUD base class for NestJS module services.
 *
 * Extends TransactionalService, so `this.db`, `@Transactional()`, and
 * `this.withTransaction()` are all available. `PrismaService` and
 * `TransactionHost` are injected automatically - no constructor needed.
 *
 * Type params:
 *  - TList    - row shape for list responses (uses `listSelect`)
 *  - TCreate  - Prisma CreateInput
 *  - TUpdate  - Prisma UpdateInput
 *  - TWhere   - Prisma WhereInput  (default: `Record<string, unknown>`)
 *  - TDetail  - row shape for single-item responses (default = TList)
 *               Omit when list and detail use the same select.
 *
 * Required overrides in subclass:
 *  - `get delegate()` - return `this.db.<model> as unknown as CrudDelegate<…>`
 *  - `listSelect`     - column whitelist for findAll
 *
 * Optional overrides:
 *  - `get detailSelect()` - column whitelist for find/create/update/delete (default = listSelect)
 *  - `defaultOrderBy`     - fallback orderBy for findAll (default = [{ createdAt: 'desc' }])
 *
 * All CRUD methods can be overridden freely in the subclass.
 *
 * @example
 * // selects/tenant.select.ts
 * export const tenantListSelect = { id: true, name: true, slug: true } satisfies Prisma.TenantSelect;
 * export const tenantDetailSelect = { ...tenantListSelect, createdAt: true } satisfies Prisma.TenantSelect;
 * export type TenantList   = Prisma.TenantGetPayload<{ select: typeof tenantListSelect }>;
 * export type TenantDetail = Prisma.TenantGetPayload<{ select: typeof tenantDetailSelect }>;
 *
 * // services/tenants.service.ts
 * @Injectable()
 * export class TenantsService extends CrudService<
 *   TenantList, Prisma.TenantCreateInput, Prisma.TenantUpdateInput,
 *   Prisma.TenantWhereInput, TenantDetail
 * > {
 *   protected get delegate() {
 *     return this.db.tenant as unknown as CrudDelegate<
 *       TenantList, TenantDetail, Prisma.TenantCreateInput,
 *       Prisma.TenantUpdateInput, Prisma.TenantWhereInput
 *     >;
 *   }
 *   protected readonly listSelect = tenantListSelect;
 *   protected override get detailSelect() { return tenantDetailSelect; }
 * }
 */
export abstract class CrudService<
  TList,
  TCreate,
  TUpdate,
  TWhere = Record<string, unknown>,
  TDetail = TList,
> extends TransactionalService {
  /** Return `this.db.<model> as unknown as CrudDelegate<…>` */
  protected abstract get delegate(): CrudDelegate<
    TList,
    TDetail,
    TCreate,
    TUpdate,
    TWhere
  >;

  /** Column whitelist used by `findAll`. */
  protected abstract readonly listSelect: object;

  /** Column whitelist used by `findById`, `create`, `update`, `delete`. Defaults to `listSelect`. */
  protected get detailSelect(): object {
    return this.listSelect;
  }

  /** Default `orderBy` for `findAll`. Override with `[]` to remove the default sort. */
  protected get defaultOrderBy(): object[] {
    return [{ createdAt: 'desc' }];
  }

  // ---------------------------------------------------------------------------
  // CRUD methods
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated list of records.
   * @param query  - page / limit from PaginationQueryDto
   * @param where  - optional Prisma WhereInput to filter results
   * @param orderBy - explicit orderBy; when provided it takes precedence over `defaultOrderBy`
   */
  findAll(
    query: PaginationQueryDto,
    where?: TWhere,
    orderBy?: object[],
  ): Promise<Page<TList>> {
    return paginate<TList>(
      query,
      () =>
        this.delegate.findMany({
          select: this.listSelect,
          where,
          orderBy: orderBy ?? this.defaultOrderBy,
          skip: query.skip,
          take: query.limit,
        }),
      () => this.delegate.count({ where }),
    );
  }

  /** Returns a single record by `id`, or `null` if not found. Uses `detailSelect`. */
  findById(id: string): Promise<TDetail | null> {
    return this.delegate.findUnique({
      where: { id },
      select: this.detailSelect,
    });
  }

  /** Returns a single record by `id`. Throws `NotFoundException` if not found. */
  async findByIdOrFail(id: string): Promise<TDetail> {
    const record = await this.findById(id);
    if (!record) throw new NotFoundException();
    return record;
  }

  /** Returns `true` if a record with the given `id` exists. */
  async exists(id: string): Promise<boolean> {
    const record = await this.delegate.findUnique({
      where: { id },
      select: { id: true },
    });
    return record !== null;
  }

  /** Returns the total count of records matching `where`. */
  count(where?: TWhere): Promise<number> {
    return this.delegate.count({ where });
  }

  /** Creates a record and returns it using `detailSelect`. Runs inside a transaction. */
  @Transactional()
  create(data: TCreate): Promise<TDetail> {
    return this.delegate.create({ data, select: this.detailSelect });
  }

  /** Updates a record by `id` and returns it using `detailSelect`. Runs inside a transaction. */
  @Transactional()
  update(id: string, data: TUpdate): Promise<TDetail> {
    return this.delegate.update({
      where: { id },
      data,
      select: this.detailSelect,
    });
  }

  /** Deletes a record by `id`. Runs inside a transaction. */
  @Transactional()
  async delete(id: string): Promise<void> {
    await this.delegate.delete({ where: { id }, select: { id: true } });
  }
}
