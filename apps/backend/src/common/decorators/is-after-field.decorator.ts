import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsAfterFieldConstraint } from '../validators/is-after-field.validator';

/**
 * Validates that the decorated date field is strictly after another date field
 * on the same object.
 *
 * Both fields must be valid ISO 8601 strings for the check to run; invalid
 * values are skipped so that `@IsDateString` can report the format error first.
 *
 * @example
 * \@IsOptional()
 * \@IsDateString()
 * \@IsAfterField('startAt', { message: 'End date must be after start date' })
 * endAt?: string;
 */
export function IsAfterField(
  siblingField: string,
  options?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options,
      constraints: [siblingField],
      validator: IsAfterFieldConstraint,
    });
  };
}
