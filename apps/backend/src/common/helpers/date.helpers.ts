import { DateTime, IANAZone } from 'luxon';

/**
 * Returns true if `tz` is a valid IANA timezone identifier recognised by Luxon.
 *
 * @example
 * isValidIANATimezone('America/New_York') // true
 * isValidIANATimezone('Fake/Zone')        // false
 */
export function isValidIANATimezone(tz: string): boolean {
  return IANAZone.isValidZone(tz);
}

/**
 * Parses an ISO 8601 string (date-only `YYYY-MM-DD` or full datetime) interpreted
 * in the given IANA timezone and returns an equivalent UTC `Date`.
 *
 * Use this when the client sends an explicit time component and you just need to
 * shift the timezone offset to UTC.
 *
 * @example
 * parseToUtc('2026-04-15T10:30:00', 'America/New_York')
 * // -> 2026-04-15T14:30:00.000Z
 */
export function parseToUtc(value: string, tz: string = 'UTC'): Date {
  return DateTime.fromISO(value, { zone: tz }).toUTC().toJSDate();
}

/**
 * Parses a date string interpreted in `tz` and returns a UTC `Date` pointing
 * to the very start of that day (00:00:00.000) in the local timezone.
 *
 * Typical use: lower bound of a date-range filter where the user sends
 * a date-only value and expects the full day to be included.
 *
 * @example
 * startOfDayUtc('2026-04-15', 'America/New_York')
 * // -> 2026-04-15T04:00:00.000Z  (midnight ET = 04:00 UTC)
 */
export function startOfDayUtc(value: string, tz: string = 'UTC'): Date {
  return DateTime.fromISO(value, { zone: tz })
    .startOf('day')
    .toUTC()
    .toJSDate();
}

/**
 * Parses a date string interpreted in `tz` and returns a UTC `Date` pointing
 * to the very end of that day (23:59:59.999) in the local timezone.
 *
 * Typical use: upper bound of a date-range filter so the full last day is included.
 *
 * @example
 * endOfDayUtc('2026-04-15', 'America/New_York')
 * // -> 2026-04-16T03:59:59.999Z  (23:59:59.999 ET = 04:00 UTC next day)
 */
export function endOfDayUtc(value: string, tz: string = 'UTC'): Date {
  return DateTime.fromISO(value, { zone: tz }).endOf('day').toUTC().toJSDate();
}
