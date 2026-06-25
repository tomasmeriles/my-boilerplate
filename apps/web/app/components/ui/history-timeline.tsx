import type React from 'react';
import { EmptyState } from '~/components/ui/empty-state';

interface HistoryTimelineEntry {
  id: string;
  from: string;
  to: string | null;
}

interface HistoryTimelineProps<T extends HistoryTimelineEntry> {
  entries: T[];
  renderEntry: (entry: T) => React.ReactNode;
  emptyMessage?: string;
}

export function HistoryTimeline<T extends HistoryTimelineEntry>({
  entries,
  renderEntry,
  emptyMessage = 'Sin historial.',
}: HistoryTimelineProps<T>) {
  if (entries.length === 0) {
    return <EmptyState message={emptyMessage} variant="inline" />;
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="ml-4">
          <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
          {renderEntry(entry)}
        </li>
      ))}
    </ol>
  );
}
