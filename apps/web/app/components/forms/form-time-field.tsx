import { useState } from 'react';
import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import { Input } from '~/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '~/components/ui/form';
import { cn } from '~/lib/utils';

// ─── PickerInput ──────────────────────────────────────────────────────────────

function PickerInput({
  value,
  min,
  max,
  placeholder,
  className,
  onCommit,
}: {
  value: number | undefined;
  min: number;
  max: number;
  placeholder: string;
  className?: string;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  function commit() {
    const n = parseInt(draft, 10);
    if (!isNaN(n)) onCommit(Math.min(max, Math.max(min, n)));
  }

  const display = focused
    ? draft
    : value !== undefined
      ? String(value).padStart(2, '0')
      : '';

  return (
    <Input
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          commit();
        }
      }}
      onFocus={(e) => {
        setDraft(value !== undefined ? String(value) : '');
        setFocused(true);
        requestAnimationFrame(() => e.target.select());
      }}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      className={cn('text-center', className)}
    />
  );
}

// ─── FormTimeField ────────────────────────────────────────────────────────────

interface FormTimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  maxHours?: number;
  optional?: boolean;
}

export function FormTimeField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  maxHours = 23,
  optional,
}: FormTimeFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const raw = field.value as string | undefined;
        const [hStr, mStr] = raw?.split(':') ?? [];
        const hours = hStr !== undefined ? parseInt(hStr, 10) : undefined;
        const minutes = mStr !== undefined ? parseInt(mStr, 10) : undefined;

        function patch(h: number | undefined, m: number | undefined) {
          const hh = (h ?? 0).toString().padStart(2, '0');
          const mm = (m ?? 0).toString().padStart(2, '0');
          field.onChange(`${hh}:${mm}`);
        }

        return (
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
              <div className="flex items-end gap-1.5">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                    hr
                  </span>
                  <PickerInput
                    value={hours}
                    min={0}
                    max={maxHours}
                    placeholder="HH"
                    className="w-full"
                    onCommit={(v) => patch(v, minutes)}
                  />
                </div>
                <span className="shrink-0 pb-2 font-bold text-muted-foreground">
                  :
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                    min
                  </span>
                  <PickerInput
                    value={minutes}
                    min={0}
                    max={59}
                    placeholder="MM"
                    className="w-full"
                    onCommit={(v) => patch(hours, v)}
                  />
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
