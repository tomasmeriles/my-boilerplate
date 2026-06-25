import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import { Input } from '~/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

interface FormTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<React.ComponentProps<'input'>, 'name'> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  optional?: boolean;
}

export function FormTextField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  optional,
  ...inputProps
}: FormTextFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {optional && (
              <span className="text-[11px] font-normal text-muted-foreground/60 tracking-wide">
                opcional
              </span>
            )}
          </FormLabel>
          <FormControl>
            <Input {...inputProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
