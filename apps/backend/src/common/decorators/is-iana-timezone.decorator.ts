import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsIANATimezoneConstraint } from '../validators/is-iana-timezone.validator';

/**
 * Validates that the decorated property is a valid IANA timezone identifier.
 *
 * Relies on Luxon's `IANAZone.isValidZone()` under the hood, so any timezone
 * accepted by Luxon (and the host's ICU data) will pass.
 *
 * @example
 * \@IsOptional()
 * \@IsIANATimezone()
 * timezone?: string;
 */
export function IsIANATimezone(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsIANATimezoneConstraint,
    });
  };
}
