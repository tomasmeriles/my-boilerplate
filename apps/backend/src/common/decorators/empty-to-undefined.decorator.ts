import { Transform } from 'class-transformer';

/**
 * Transforms empty strings to `undefined` so that `@IsOptional()` skips
 * validation and the value is omitted from the resulting object.
 */
export const EmptyToUndefined = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  );
