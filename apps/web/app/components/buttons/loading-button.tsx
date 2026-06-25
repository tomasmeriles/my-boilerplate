import * as React from 'react';
import { Button, buttonVariants } from '~/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M8 2a6 6 0 0 1 6 6h-2a4 4 0 0 0-4-4V2Z"
      />
    </svg>
  );
}

// ─── LoadingButton ────────────────────────────────────────────────────────────

export interface LoadingButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** When true, disables the button and shows the spinner. */
  isLoading?: boolean;
  /** Text shown next to the spinner while loading. Falls back to children. */
  loadingText?: string;
}

export function LoadingButton({
  isLoading = false,
  loadingText,
  disabled,
  children,
  className,
  variant,
  size,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={isLoading || disabled}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* Spinner + label — slides in from top when loading */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-1.5 transition-all duration-200',
          isLoading
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0',
        )}
        aria-hidden={!isLoading}
      >
        <Spinner className="size-3.5" />
        {(loadingText ?? children) && <span>{loadingText ?? children}</span>}
      </span>

      {/* Original content — slides out downward when loading */}
      <span
        className={cn(
          'flex items-center gap-1.5 transition-all duration-200',
          isLoading
            ? 'translate-y-full opacity-0'
            : 'translate-y-0 opacity-100',
        )}
        aria-hidden={isLoading}
      >
        {children}
      </span>
    </Button>
  );
}
