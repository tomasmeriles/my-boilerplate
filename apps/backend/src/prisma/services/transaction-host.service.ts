import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import type { Prisma } from '@prisma/client';

export type TxClient = Prisma.TransactionClient;

/**
 * Singleton that stores the active Prisma transaction client in AsyncLocalStorage.
 * Each async execution context (i.e. each request) has its own isolated slot,
 * so concurrent requests never share or overwrite each other's transactions.
 *
 * Consumed by TransactionalService.db and the @Transactional() decorator.
 */
@Injectable()
export class TransactionHost {
  private readonly storage = new AsyncLocalStorage<TxClient>();

  /** Returns the active transaction client for the current async context, or undefined. */
  get tx(): TxClient | undefined {
    return this.storage.getStore();
  }

  /**
   * Runs `fn` with `client` set as the active transaction for the current context.
   * Any code inside `fn` (and its callees) that reads `this.tx` will see `client`.
   */
  run<T>(client: TxClient, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(client, fn);
  }
}
