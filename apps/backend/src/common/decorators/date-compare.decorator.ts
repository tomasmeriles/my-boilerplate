import { registerDecorator, ValidationOptions } from 'class-validator';
import {
  DateCompareConstraint,
  type DateCompareOptions,
} from '../validators/date-compare.validator';

export function DateCompare(
  options: DateCompareOptions,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [options],
      validator: DateCompareConstraint,
    });
  };
}
