import type { LucideIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: React.ComponentProps<typeof Button>['variant'];
}

interface EmptyStateProps {
  icon?: LucideIcon;
  message: string;
  description?: string;
  action?: EmptyStateAction;
  /**
   * inline — compact, centered, no border (default — fits inside cards/tables)
   * card   — bordered card with more padding (standalone section)
   * page   — full-page centered (empty pages / dashboards)
   */
  variant?: 'inline' | 'card' | 'page';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  message,
  description,
  action,
  variant = 'inline',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variant === 'inline' && 'gap-2 py-6',
        variant === 'card' &&
          'gap-3 rounded-2xl border border-dashed border-border/60 p-10',
        variant === 'page' && 'gap-4 py-24',
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'text-muted-foreground/50',
            variant === 'inline' && 'size-8',
            variant === 'card' && 'size-10',
            variant === 'page' && 'size-12',
          )}
        />
      )}

      <div className={cn('space-y-1', variant === 'page' && 'space-y-2')}>
        <p
          className={cn(
            'font-medium text-muted-foreground',
            variant === 'inline' && 'text-sm',
            variant === 'card' && 'text-base',
            variant === 'page' && 'text-lg',
          )}
        >
          {message}
        </p>
        {description && (
          <p
            className={cn(
              'text-muted-foreground/70',
              variant === 'inline' && 'text-xs',
              variant === 'card' && 'text-sm',
              variant === 'page' && 'text-sm',
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <Button
          size={variant === 'page' ? 'default' : 'sm'}
          variant={action.variant ?? 'outline'}
          onClick={action.onClick}
          className="mt-1"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
