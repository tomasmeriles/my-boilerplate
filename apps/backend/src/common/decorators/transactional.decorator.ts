import type { TransactionalService } from '../base/transactional-service.base';

/**
 * Transaction propagation modes.
 *
 * REQUIRED    - Reuse the active transaction if one exists; open a new one if not.
 *               This is the safe default: nested @Transactional() calls share the
 *               same transaction and only the outermost one commits/rolls back.
 *
 * REQUIRES_NEW - Always open a new transaction, suspending the active one.
 *               Use this when a method must commit independently (e.g. audit logs
 *               that should persist even if the outer transaction rolls back).
 */
export enum Propagation {
  REQUIRED = 'REQUIRED',
  REQUIRES_NEW = 'REQUIRES_NEW',
}

export interface TransactionalOptions {
  propagation?: Propagation;
}

type AnyAsyncFn = (...args: never[]) => Promise<unknown>;

/**
 * Method decorator that wraps the decorated method in a Prisma transaction.
 *
 * Requires the class to extend TransactionalService so that `this._transact`
 * and `this.db` are available.
 *
 * @example
 * // REQUIRED (default): reuses the caller's tx if one is active
 * @Transactional()
 * async createOrder(data: CreateOrderDto) {
 *   await this.db.order.create({ data });
 *   await this.invoiceService.issue(data); // shares the same tx automatically
 * }
 *
 * @example
 * // REQUIRES_NEW: always opens its own tx (e.g. audit log that must survive rollbacks)
 * @Transactional({ propagation: Propagation.REQUIRES_NEW })
 * async logAuditEvent(event: AuditEvent) {
 *   await this.db.auditLog.create({ data: event });
 * }
 */
export function Transactional(options?: TransactionalOptions): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const original = descriptor.value as AnyAsyncFn;
    const propagation = options?.propagation ?? Propagation.REQUIRED;

    descriptor.value = function (
      this: TransactionalService,
      ...args: never[]
    ): Promise<unknown> {
      return this._transact(() => original.apply(this, args), propagation);
    };

    return descriptor;
  };
}
