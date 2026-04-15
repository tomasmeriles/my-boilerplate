import { DateTime } from 'luxon';
import { z } from 'zod';
import { getSystemTimezone } from '~/lib/datetime';

/**
 * Reusable Zod field for ISO 8601 date strings.
 * Validates both format (regex) and calendar correctness (Luxon),
 * so invalid dates like `2026-02-30` are rejected.
 * Accepts date-only (`YYYY-MM-DD`) or full datetime (`YYYY-MM-DDTHH:mm:ssZ`).
 */
export const isoDateField = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/,
    'Must be a valid date (YYYY-MM-DD or ISO 8601)',
  )
  .refine((v) => DateTime.fromISO(v).isValid, 'Must be a valid calendar date');

/**
 * Raw shape for the date range fields. Spread this into a `z.object()`
 * before calling `refineDateRange()` - which converts the schema to
 * `ZodEffects` and blocks further `.extend()` calls.
 */
export const dateRangeShape = {
  from: isoDateField.optional(),
  to: isoDateField.optional(),
  timezone: z.string().default(() => getSystemTimezone()),
};

/**
 * Pure `ZodObject` - extensible with `.extend()` or `.merge()`.
 * Does NOT include cross-field validation; call `refineDateRange()` after
 * all fields have been composed.
 */
export const dateRangeSchema = z.object(dateRangeShape);

/**
 * Applies cross-field date range validation to any `ZodObject` that includes
 * `from` and `to` string fields.
 *
 * Validates:
 * - `from` must not be later than `to` when both are present.
 *
 * Must be called **last** because `.superRefine()` converts `ZodObject`
 * to `ZodEffects`, which cannot be extended further.
 *
 * @example - spread shape + own fields, then refine
 * export const auditFilterSchema = refineDateRange(
 *   z.object({ ...dateRangeShape, userId: z.string().optional() }),
 * );
 *
 * @example - extend an existing schema, then refine
 * export const reportsFilterSchema = refineDateRange(
 *   dateRangeSchema.extend({ reportType: z.string() }),
 * );
 */
export function refineDateRange<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
): z.ZodEffects<T> {
  return schema.superRefine((data, ctx) => {
    const d = data as { from?: string; to?: string };
    if (!d.from || !d.to) return;

    const from = DateTime.fromISO(d.from);
    const to = DateTime.fromISO(d.to);

    if (from.isValid && to.isValid && from > to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must not be later than end date',
        path: ['to'],
      });
    }
  });
}

export type DateRangeFormValues = z.infer<typeof dateRangeSchema>;
