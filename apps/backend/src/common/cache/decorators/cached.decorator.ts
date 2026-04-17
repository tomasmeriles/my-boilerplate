import type { CacheHost } from '../services/cache-host.service';

export interface CachedOptions<TArgs extends unknown[]> {
  /** Build the Redis key from the method arguments. */
  key: (...args: TArgs) => string;
  /** TTL in seconds. */
  ttl: number | ((...args: TArgs) => number);
}

type HasCacheHost = { _cacheHost: CacheHost };

export function Cached<TArgs extends unknown[]>(
  options: CachedOptions<TArgs>,
): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const original = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;

    descriptor.value = function (
      this: HasCacheHost,
      ...args: unknown[]
    ): Promise<unknown> {
      const cacheKey = options.key(...(args as TArgs));
      const ttl =
        typeof options.ttl === 'function'
          ? options.ttl(...(args as TArgs))
          : options.ttl;

      return this._cacheHost.wrap(cacheKey, ttl, () =>
        original.apply(this, args),
      );
    };

    return descriptor;
  };
}
