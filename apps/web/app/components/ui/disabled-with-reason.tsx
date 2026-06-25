import { cloneElement } from 'react';

import { cn } from '~/lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface DisabledWithReasonProps {
  disabled?: boolean;
  reason: string;
  children: React.ReactElement<{ disabled?: boolean; className?: string }>;
  side?: React.ComponentProps<typeof TooltipContent>['side'];
  wrapperClassName?: string;
}

export function DisabledWithReason({ disabled, reason, children, side = 'top', wrapperClassName }: DisabledWithReasonProps) {
  if (!disabled) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex cursor-not-allowed", wrapperClassName)}>
          {cloneElement(children, {
            disabled: true,
            className: cn(children.props.className, 'pointer-events-none'),
          })}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side}>{reason}</TooltipContent>
    </Tooltip>
  );
}
