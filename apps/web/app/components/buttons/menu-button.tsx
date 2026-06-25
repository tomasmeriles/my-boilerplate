import * as React from 'react';
import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

export interface MenuButtonOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  separator?: boolean;
}

export interface MenuButtonProps<T = string>
  extends VariantProps<typeof buttonVariants> {
  label: string;
  icon?: React.ReactNode;
  options: MenuButtonOption<T>[];
  onSelect: (value: T) => void;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  align?: React.ComponentProps<typeof DropdownMenuContent>['align'];
  className?: string;
}

export function MenuButton<T = string>({
  label,
  icon,
  options,
  onSelect,
  isLoading = false,
  loadingText,
  disabled = false,
  variant = 'default',
  size = 'default',
  align = 'start',
  className,
}: MenuButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const isDisabled = disabled || isLoading;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDisabled}
          className={cn('gap-1.5', className)}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="size-3.5" />
              {loadingText ?? label}
            </>
          ) : (
            <>
              {icon}
              {label}
              <ChevronDownIcon
                className={cn(
                  'size-3.5 opacity-60 transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="min-w-44">
        {options.map((opt, i) => (
          <div key={String(opt.value)}>
            {opt.separator && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={() => onSelect(opt.value)}
              className="cursor-pointer"
            >
              <div className="flex items-start gap-2">
                {opt.icon && (
                  <span className="mt-0.5 shrink-0">{opt.icon}</span>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{opt.label}</span>
                  {opt.description && (
                    <span className="text-xs font-normal text-muted-foreground">
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
  );
}
