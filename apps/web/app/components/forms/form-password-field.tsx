import { useState } from 'react';
import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '~/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

interface FormPasswordFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<React.ComponentProps<'input'>, 'name' | 'type'> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
}

export function FormPasswordField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  ...inputProps
}: FormPasswordFieldProps<TFieldValues, TName>) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={visible ? 'text' : 'password'}
                className="pr-9"
                {...inputProps}
                {...field}
              />
              <button
                type="button"
                aria-label="Hold to reveal password"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-none select-none"
                onPointerDown={(e) => {
                  e.preventDefault();
                  setVisible(true);
                }}
                onPointerUp={() => setVisible(false)}
                onPointerLeave={() => setVisible(false)}
              >
                {visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
