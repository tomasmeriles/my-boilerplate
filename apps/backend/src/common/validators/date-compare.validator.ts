import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DateTime } from 'luxon';

export interface DateCompareOptions {
  after?: 'now' | Date;
  before?: 'now' | Date;
  dateOnly?: boolean;
  inclusive?: boolean;
}

@ValidatorConstraint({ name: 'DateCompare', async: false })
export class DateCompareConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const opts = args.constraints[0] as DateCompareOptions;

    const dt =
      value instanceof Date
        ? DateTime.fromJSDate(value)
        : typeof value === 'string'
          ? DateTime.fromISO(value)
          : null;

    if (!dt?.isValid) return true;

    if (opts.after) {
      const ref =
        opts.after === 'now'
          ? DateTime.utc()
          : DateTime.fromJSDate(opts.after).toUTC();
      const a = opts.dateOnly ? dt.toUTC().startOf('day') : dt;
      const b = opts.dateOnly ? ref.startOf('day') : ref;
      const valid = opts.inclusive ? a >= b : a > b;
      if (!valid) return false;
    }

    if (opts.before) {
      const ref =
        opts.before === 'now'
          ? DateTime.utc()
          : DateTime.fromJSDate(opts.before).toUTC();
      const a = opts.dateOnly ? dt.toUTC().startOf('day') : dt;
      const b = opts.dateOnly ? ref.startOf('day') : ref;
      const valid = opts.inclusive ? a <= b : a < b;
      if (!valid) return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const opts = args.constraints[0] as DateCompareOptions;
    const parts: string[] = [];
    if (opts.after === 'now') {
      parts.push(opts.inclusive ? 'today or later' : 'a future date');
    }
    if (opts.before === 'now') {
      parts.push(opts.inclusive ? 'today or earlier' : 'a past date');
    }
    return parts.length
      ? `${args.property} must be ${parts.join(' and ')}`
      : 'Invalid date';
  }
}
