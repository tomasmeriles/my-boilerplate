import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';
import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { cn } from '~/lib/utils';

export interface CardSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

interface FormCardSelectFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  options: CardSelectOption[];
  columns?: 1 | 2 | 3 | 4;
  disabled?: boolean;
}

const COLS_CLASS: Record<
  NonNullable<FormCardSelectFieldProps<FieldValues, string>['columns']>,
  string
> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

export function FormCardSelectField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  options,
  columns = 3,
  disabled = false,
}: FormCardSelectFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div
            className={cn('grid grid-cols-1 gap-2 p-px', COLS_CLASS[columns])}
          >
            {options.map((opt) => {
              const Icon = opt.icon;
              const selected = field.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (!disabled) field.onChange(opt.value);
                  }}
                  disabled={disabled}
                  className={cn(
                    'relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all duration-200',
                    disabled && 'cursor-not-allowed opacity-60',
                    selected
                      ? 'border-primary bg-primary/5 shadow-sm outline outline-primary'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50',
                  )}
                >
                  {Icon && (
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-200',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div>
                    <p
                      className={cn(
                        'text-xs font-semibold',
                        selected ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {opt.label}
                    </p>
                    {opt.description && (
                      <p className="text-xs leading-tight text-muted-foreground/70">
                        {opt.description}
                      </p>
                    )}
                  </div>
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
