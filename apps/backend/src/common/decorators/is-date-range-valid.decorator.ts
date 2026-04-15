import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsDateRangeValidConstraint } from '../validators/is-date-range-valid.validator';

/**
 * Cross-field validator - ensures that the decorated property (`to`) is not
 * earlier than the `from` field on the same object.
 *
 * Apply to the `to` field. Both `from` and `to` must be valid ISO 8601 strings
 * (validated separately) for this check to run; invalid values are skipped so
 * that `\@IsISO8601` can report the appropriate format error first.
 *
 * @example
 * \@IsOptional()
 * \@IsISO8601({ strict: true })
 * \@IsDateRangeValid()
 * to?: string;
 */
export function IsDateRangeValid(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsDateRangeValidConstraint,
    });
  };
}
