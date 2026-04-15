import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidIANATimezone } from '../helpers/date.helpers';

@ValidatorConstraint({ name: 'IsIANATimezone', async: false })
export class IsIANATimezoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidIANATimezone(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid IANA timezone identifier (e.g. "America/New_York", "Europe/Madrid", "UTC").`;
  }
}
