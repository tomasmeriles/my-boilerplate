import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import { Textarea } from '~/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

interface FormTextareaFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<React.ComponentProps<'textarea'>, 'name'> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  optional?: boolean;
}

export function FormTextareaField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  optional,
  ...textareaProps
}: FormTextareaFieldProps<TFieldValues, TName>) {
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
            <Textarea {...textareaProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
