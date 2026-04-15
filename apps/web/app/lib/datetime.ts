import { DateTime } from 'luxon';

export function getSystemTimezone(): string {
  return DateTime.local().zoneName ?? 'UTC';
}

export function formatDate(
  date: string | Date,
  format = 'DD',
  timezone = getSystemTimezone(),
): string {
  const dt =
    typeof date === 'string'
      ? DateTime.fromISO(date, { zone: timezone })
      : DateTime.fromJSDate(date, { zone: timezone });

  return dt.toFormat(format);
}

/*
 * Convenience wrapper for common date-time format (e.g. "Apr 20, 2024, 3:45 PM").
 */
export function formatDateTime(
  date: string | Date,
  format = 'DD, t',
  timezone = getSystemTimezone(),
): string {
  return formatDate(date, format, timezone);
}

export function fromNow(
  date: string | Date,
  timezone = getSystemTimezone(),
): string {
  const dt =
    typeof date === 'string'
      ? DateTime.fromISO(date, { zone: timezone })
      : DateTime.fromJSDate(date, { zone: timezone });

  return dt.toRelative() ?? '';
}

export { DateTime };
