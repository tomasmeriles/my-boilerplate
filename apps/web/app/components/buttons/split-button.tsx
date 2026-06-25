import { useState } from 'react';
import type React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, buttonVariants } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import type { VariantProps } from 'class-variance-authority';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SplitButtonOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  /** If true, a separator is rendered before this option in the dropdown. */
  separator?: boolean;
}

export interface SplitButtonProps<T = string> {
  /** The primary action shown as a full button on the left. */
  primary: SplitButtonOption<T>;
  /** Additional actions shown in the dropdown. */
  options?: SplitButtonOption<T>[];
  onSelect: (value: T) => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: VariantProps<typeof buttonVariants>['size'];
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SplitButton<T = string>({
  primary,
  options = [],
  onSelect,
  isLoading = false,
  disabled = false,
  size = 'default',
  className,
}: SplitButtonProps<T>) {
  const variant = primary.variant ?? 'default';
  const isDisabled = disabled || isLoading;
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant={variant}
        size={size}
        disabled={isDisabled}
        onClick={() => onSelect(primary.value)}
        className={cn(
          'focus-visible:z-10',
          options.length > 0 && 'rounded-r-none border-r-0',
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <Spinner size="sm" />
            {primary.label}
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            {primary.icon}
            {primary.label}
          </span>
        )}
      </Button>

      {options.length > 0 && (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              disabled={isDisabled}
              className={cn(
                'rounded-l-none px-2 focus-visible:z-10',
                size === 'sm' && 'px-1.5',
              )}
              aria-label="More options"
            >
              <ChevronDown
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="min-w-52">
            {options.map((opt, i) => (
              <div key={String(opt.value)}>
                {opt.separator && i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onSelect={() => onSelect(opt.value)}
                  variant={opt.variant === 'destructive' ? 'destructive' : 'default'}
                  className="cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    {opt.icon && <span className="mt-0.5 shrink-0">{opt.icon}</span>}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
