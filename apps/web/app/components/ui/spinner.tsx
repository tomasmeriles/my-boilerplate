import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'size-4 border-2',
        md: 'size-6 border-2',
        lg: 'size-8 border-[3px]',
        xl: 'size-12 border-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface SpinnerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

export function Spinner({ size, className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  );
}
