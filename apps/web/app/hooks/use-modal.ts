import { useState } from 'react';

export function useModal<T = undefined>() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  return {
    open,
    data,
    show: (d?: T) => {
      setData(d as T);
      setOpen(true);
    },
    // keep data on hide — avoids content flicker during close animation
    hide: () => setOpen(false),
    onOpenChange: (v: boolean) => {
      if (!v) setOpen(false);
    },
  };
}
