import { useMemo, useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { CalendarIcon, X } from 'lucide-react';
import type { Matcher, Formatters } from 'react-day-picker';
import {
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { Calendar } from '~/components/ui/calendar';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { cn } from '~/lib/utils';

// ─── PickerInput ──────────────────────────────────────────────────────────────
// Numeric-only input with clamped commit on blur.

function PickerInput({
  value,
  min,
  max,
  placeholder,
  padStart = 2,
  className,
  onCommit,
}: {
  value: number | undefined;
  min: number;
  max: number;
  placeholder: string;
  padStart?: number;
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
      ? String(value).padStart(padStart, '0')
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

// ─── Internal DateTimePicker ──────────────────────────────────────────────────

function DateTimePicker({
  value,
  onChange,
  onClear,
  disabled,
  disablePast = false,
  disableFuture = false,
  dateOnly = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
  disabled?: Matcher | Matcher[];
  disablePast?: boolean;
  disableFuture?: boolean;
  dateOnly?: boolean;
}) {
  useEffect(() => {
    if (disablePast && disableFuture) {
      console.warn(
        '[FormDateTimeField] disablePast and disableFuture are both true — no date will be selectable.',
      );
    }
  }, [disablePast, disableFuture]);

  const [open, setOpen] = useState(false);

  const dt = value ? DateTime.fromISO(value).toLocal() : null;
  const isValid = dt?.isValid ?? false;

  const hour = isValid ? dt!.hour : undefined;
  const minute = isValid ? dt!.minute : undefined;
  const selected = isValid ? dt!.toJSDate() : undefined;

  const now = DateTime.now();
  const isToday = isValid && dt!.hasSame(now, 'day');
  const minHour = disablePast && isToday ? now.hour : 0;
  const minMinute =
    disablePast && isToday && hour === now.hour ? now.minute : 0;
  const maxHour = disableFuture && isToday ? now.hour : 23;
  const maxMinute =
    disableFuture && isToday && hour === now.hour ? now.minute : 59;

  const extraMatchers = Array.isArray(disabled)
    ? disabled
    : disabled
      ? [disabled]
      : [];
  const calendarDisabled: Matcher[] = [
    ...(disablePast ? [{ before: now.startOf('day').toJSDate() }] : []),
    ...(disableFuture ? [{ after: now.endOf('day').toJSDate() }] : []),
    ...extraMatchers,
  ];

  const esFormatters: Partial<Formatters> = useMemo(
    () => ({
      formatCaption: (date: Date) =>
        DateTime.fromJSDate(date).setLocale('es').toFormat('MMMM yyyy'),
      formatWeekdayName: (date: Date) =>
        DateTime.fromJSDate(date).setLocale('es').toFormat('ccc'),
    }),
    [],
  );

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const dayDt = DateTime.fromJSDate(day);
    if (dateOnly) {
      onChange(dayDt.startOf('day').toUTC().toISO() ?? '');
      return;
    }
    let h = hour ?? 0;
    let m = minute ?? 0;
    if (disablePast && dayDt.hasSame(now, 'day')) {
      const candidate = dayDt.set({ hour: h, minute: m, second: 0, millisecond: 0 });
      if (candidate < now) {
        h = now.hour;
        m = now.minute;
      }
    }
    if (disableFuture && dayDt.hasSame(now, 'day')) {
      const candidate = dayDt.set({ hour: h, minute: m, second: 0, millisecond: 0 });
      if (candidate > now) {
        h = now.hour;
        m = now.minute;
      }
    }
    const picked = dayDt.set({ hour: h, minute: m, second: 0, millisecond: 0 });
    onChange(picked.toUTC().toISO() ?? '');
  }

  function patchTime(fields: { hour?: number; minute?: number }) {
    if (!isValid) return;
    let next = dt!.set({ ...fields, second: 0, millisecond: 0 });
    if (disablePast && next < now) {
      next = now.set({ second: 0, millisecond: 0 });
    }
    if (disableFuture && next > now) {
      next = now.set({ second: 0, millisecond: 0 });
    }
    onChange(next.toUTC().toISO() ?? '');
  }

  const display = isValid
    ? dt!.toFormat(dateOnly ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm')
    : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !display && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {display || <span>{dateOnly ? 'Seleccionar fecha' : 'Seleccionar fecha y hora'}</span>}
          </span>
          {onClear && display && (
            <span
              role="button"
              aria-label="Clear date"
              className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 overflow-y-auto"
        style={{ maxHeight: 'var(--radix-popover-content-available-height)' }}
        align="start"
        collisionPadding={8}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }
        }}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          disabled={calendarDisabled}
          autoFocus
          formatters={esFormatters}
          weekStartsOn={1}
        />

        {!dateOnly && (
          <>
            <Separator />

            {/* Time section */}
            <div className="flex items-center justify-center gap-3 p-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hora
              </span>
              <div className="flex items-center gap-1">
                <PickerInput
                  value={hour}
                  min={minHour}
                  max={maxHour}
                  placeholder="HH"
                  className="w-12"
                  onCommit={(v) => patchTime({ hour: v })}
                />
                <span className="px-0.5 font-bold text-muted-foreground">:</span>
                <PickerInput
                  value={minute}
                  min={minMinute}
                  max={maxMinute}
                  placeholder="MM"
                  className="w-12"
                  onCommit={(v) => patchTime({ minute: v })}
                />
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { DateTimePicker as DatePicker };

// ─── FormDateTimeField ────────────────────────────────────────────────────────

interface FormDateTimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  optional?: boolean;
  disabled?: Matcher | Matcher[];
  disablePast?: boolean;
  disableFuture?: boolean;
  dateOnly?: boolean;
}

export function FormDateTimeField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  optional,
  disabled,
  disablePast,
  disableFuture,
  dateOnly,
}: FormDateTimeFieldProps<TFieldValues, TName>) {
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
            <DateTimePicker
              value={field.value as string}
              onChange={field.onChange}
              onClear={optional ? () => field.onChange('') : undefined}
              disabled={disabled}
              disablePast={disablePast}
              disableFuture={disableFuture}
              dateOnly={dateOnly}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
