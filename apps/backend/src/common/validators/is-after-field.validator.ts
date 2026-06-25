import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DateTime } from 'luxon';

@ValidatorConstraint({ name: 'IsAfterField', async: false })
export class IsAfterFieldConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [siblingField] = args.constraints as [string];
    const sibling = (args.object as Record<string, unknown>)[siblingField];

    const toDateTime = (v: unknown): DateTime | null => {
      if (v instanceof Date) return DateTime.fromJSDate(v);
      if (typeof v === 'string') return DateTime.fromISO(v);
      return null;
    };

    const siblingDt = toDateTime(sibling);
    const valueDt = toDateTime(value);

    // Skip when either value is missing or invalid — let @IsDate/@IsDateString report that.
    if (!siblingDt?.isValid || !valueDt?.isValid) return true;

    return valueDt > siblingDt;
  }

  defaultMessage(args: ValidationArguments): string {
    const [siblingField] = args.constraints as [string];
    return `${args.property} must be after ${siblingField}`;
  }
}
