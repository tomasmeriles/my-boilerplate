import { useState, useEffect, useRef, useCallback } from 'react';
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

interface FormNumberFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  /** Pass empty string to render without a label (compact rows). */
  label: string;
  optional?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Whether to parse the value as a float. Defaults to integer. */
  valueAs?: 'int' | 'float';
  /** Symbol shown as a left adornment inside the input (e.g. "$", "€", "%"). */
  prefix?: string;
}

function clamp(num: number, min?: number, max?: number): number {
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
}

const FLOAT_REGEX = /^\d*\.?\d*$/;
const INT_REGEX = /^\d*$/;

function NumberInput({
  value,
  onChange,
  onBlur,
  min,
  max,
  step,
  placeholder,
  valueAs,
  prefix,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  onBlur: () => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  valueAs: 'int' | 'float';
  prefix?: string;
}) {
  const [display, setDisplay] = useState(() =>
    value !== undefined && value !== null && value !== ''
      ? String(value)
      : '',
  );
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focused) {
      setDisplay(
        value !== undefined && value !== null && value !== ''
          ? String(value)
          : '',
      );
    }
  }, [value, focused]);

  const handleChange = useCallback(
    (raw: string) => {
      if (valueAs === 'float') {
        if (!FLOAT_REGEX.test(raw)) return;
        setDisplay(raw);
        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) onChange(parsed);
      } else {
        if (!INT_REGEX.test(raw)) return;
        setDisplay(raw);
        onChange(raw === '' ? undefined : parseInt(raw, 10));
      }
    },
    [valueAs, onChange],
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    const raw = display;
    if (raw === '' || raw === '.') {
      onChange(undefined);
      setDisplay('');
      onBlur();
      return;
    }
    let num = valueAs === 'float' ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(num)) {
      num = clamp(num, min, max);
      onChange(num);
      setDisplay(String(num));
    }
    onBlur();
  }, [display, valueAs, min, max, onChange, onBlur]);

  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        ref={ref}
        type="text"
        inputMode={valueAs === 'float' ? 'decimal' : 'numeric'}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onChange={(e) => handleChange(e.target.value)}
        className={prefix ? 'pl-6' : undefined}
      />
    </div>
  );
}

export function FormNumberField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  optional,
  placeholder,
  min,
  max,
  step,
  valueAs = 'int',
  prefix,
}: FormNumberFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              {label}
              {optional && (
                <span className="text-[11px] font-normal text-muted-foreground/60 tracking-wide">
                  opcional
                </span>
              )}
            </FormLabel>
          )}
          <FormControl>
            <NumberInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              valueAs={valueAs}
              prefix={prefix}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
