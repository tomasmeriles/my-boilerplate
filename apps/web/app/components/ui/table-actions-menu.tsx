import { MoreHorizontal } from 'lucide-react';
import type React from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

export interface TableAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  separator?: boolean;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  show?: boolean;
}

interface TableActionsMenuProps {
  actions: TableAction[];
}

export function TableActionsMenu({ actions }: TableActionsMenuProps) {
  const visibleActions = actions.filter((a) => a.show !== false);
  if (visibleActions.length === 0) return null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Acciones"
          className="text-muted-foreground hover:text-primary!"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {visibleActions.map((action, i) => {
          const item = (
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={
                action.variant === 'destructive'
                  ? 'hover:bg-destructive/10! hover:text-destructive! text-destructive!'
                  : 'hover:bg-primary/10! hover:text-primary!'
              }
            >
              {action.icon && (
                <action.icon className="size-4 mr-2 text-inherit" />
              )}
              {action.label}
            </DropdownMenuItem>
          );

          return (
            <div key={action.label}>
              {action.separator && i > 0 && <DropdownMenuSeparator />}
              {action.disabled && action.disabledReason ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{item}</span>
                  </TooltipTrigger>
                  <TooltipContent side="left">{action.disabledReason}</TooltipContent>
                </Tooltip>
              ) : (
                item
              )}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}
