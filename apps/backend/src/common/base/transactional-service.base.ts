import { Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  TransactionHost,
  type TxClient,
} from '../../prisma/services/transaction-host.service';
import { Propagation } from '../decorators/transactional.decorator';

export type { TxClient };
export type TxOptions = Parameters<PrismaService['$transaction']>[1];

/**
 * Base class for services that interact with the database and want transparent
 * transaction support without passing `tx` through every method signature.
 *
 * How it works:
 *  - `this.db` returns the active transaction client if one exists in the current
 *    async context (via AsyncLocalStorage), or falls back to the plain PrismaService.
 *  - `@Transactional()` opens a transaction at the method boundary and stores it in
 *    AsyncLocalStorage so every `this.db` call inside that method - and inside any
 *    service method called from it - automatically uses the same transaction.
 *  - `this.withTransaction()` is the programmatic equivalent for cases where a
 *    decorator is not practical (e.g. conditional transactions in loops).
 *
 * `PrismaService` and `TransactionHost` are injected automatically via property
 * injection - subclasses do not need to declare them or call `super()`.
 */
export abstract class TransactionalService {
  @Inject(PrismaService)
  protected readonly prisma!: PrismaService;

  @Inject(TransactionHost)
  private readonly txHost!: TransactionHost;

  /**
   * Returns the active transaction client for the current request context,
   * or the plain PrismaService if no transaction is active.
   * Use this for every DB operation instead of `this.prisma`.
   */
  protected get db(): PrismaService | TxClient {
    return this.txHost.tx ?? this.prisma;
  }

  /**
   * Opens a Prisma interactive transaction programmatically.
   * If a transaction is already active (REQUIRED semantics), it is reused.
   * Prefer `@Transactional()` for method-level boundaries.
   */
  protected withTransaction<T>(
    fn: () => Promise<T>,
    options?: TxOptions,
  ): Promise<T> {
    return this._transact(fn, Propagation.REQUIRED, options);
  }

  /**
   * Internal method used by the @Transactional() decorator.
   * Not intended for direct use in subclasses - use withTransaction() instead.
   */
  async _transact<T>(
    fn: () => Promise<T>,
    propagation: Propagation,
    options?: TxOptions,
  ): Promise<T> {
    if (propagation === Propagation.REQUIRED && this.txHost.tx) {
      return fn(); // reuse existing transaction
    }

    // Open a new transaction (for both REQUIRES_NEW and REQUIRED without active tx)
    return this.prisma.$transaction((tx) => this.txHost.run(tx, fn), options);
  }
}
