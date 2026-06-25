import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';

/**
 * Transforms an ISO 8601 string (or existing Date) into a `Date` object.
 * Returns `undefined` when the value is falsy, so `@IsOptional()` can skip
 * further validation on absent fields.
 *
 * Pair with `@IsDate()` instead of `@IsDateString()`.
 *
 * @example
 * @IsDate()
 * @ToDate()
 * startAt!: Date;
 */
export const ToDate = () =>
  Transform(({ value }: { value: unknown }) => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const dt = DateTime.fromISO(value as string, { setZone: true });
    return dt.isValid ? dt.toJSDate() : value;
  });
