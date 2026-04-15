import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DateTime } from 'luxon';

@ValidatorConstraint({ name: 'IsDateRangeValid', async: false })
export class IsDateRangeValidConstraint implements ValidatorConstraintInterface {
  validate(to: unknown, args: ValidationArguments): boolean {
    const { from } = args.object as { from?: string };

    // Only validate when both bounds are present and to is a string.
    // Format/calendar validity is enforced separately by @IsISO8601.
    if (!from || typeof to !== 'string') return true;

    const fromDt = DateTime.fromISO(from);
    const toDt = DateTime.fromISO(to);

    // If either value is not a valid date, let @IsISO8601 report the error.
    if (!fromDt.isValid || !toDt.isValid) return true;

    return fromDt <= toDt;
  }

  defaultMessage(): string {
    return '"from" must not be later than "to"';
  }
}
