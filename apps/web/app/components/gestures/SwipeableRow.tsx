import { useState, useEffect, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { cn } from '~/lib/utils';
import type { TableAction } from '~/components/ui/table-actions-menu';

const ACTION_WIDTH = 64;

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: TableAction[];
  disabled?: boolean;
}

export function SwipeableRow({ children, actions, disabled = false }: SwipeableRowProps) {
  const visibleActions = actions.filter((a) => a.show !== false && !a.disabled);
  const actionsWidth = visibleActions.length * ACTION_WIDTH;

  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const snapTo = (x: number) => {
    setIsAnimating(true);
    setTranslateX(x);
    setIsOpen(x !== 0);
  };

  const bind = useDrag(
    ({ movement: [mx], last, cancel, first }) => {
      if (disabled || visibleActions.length === 0) {
        cancel();
        return;
      }

      if (first) setIsAnimating(false);

      const base = isOpen ? -actionsWidth : 0;
      const next = Math.min(0, Math.max(base + mx, -actionsWidth));

      if (!last) {
        setTranslateX(next);
      } else {
        const delta = next - base;
        if (delta < -actionsWidth / 3) {
          snapTo(-actionsWidth);
        } else if (delta > actionsWidth / 3) {
          snapTo(0);
        } else {
          snapTo(base);
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
    },
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        snapTo(0);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  if (disabled || visibleActions.length === 0) {
    return <>{children}</>;
  }

  return (
    <div ref={rowRef} className="relative overflow-hidden">
      {/* Action buttons revealed behind the row */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: actionsWidth }}
      >
        {visibleActions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              snapTo(0);
              action.onClick();
            }}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-white transition-opacity',
              action.variant === 'destructive' ? 'bg-destructive' : 'bg-muted-foreground',
            )}
          >
            {action.icon && <action.icon className="size-4" />}
            <span className="max-w-[52px] truncate">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Draggable row */}
      <div
        {...bind()}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isAnimating ? 'transform 0.25s ease' : 'none',
          touchAction: 'pan-y',
        }}
        className="relative bg-background"
      >
        {children}
      </div>
    </div>
  );
}
