import { useEffect, useState } from 'react';

/**
 * Represents the current screen size breakpoint.
 *
 * - `xs`  - Extra small  (< 640px)   - Small phones
 * - `sm`  - Small        (≥ 640px)   - Large phones / small tablets
 * - `md`  - Medium       (≥ 768px)   - Tablets
 * - `lg`  - Large        (≥ 1024px)  - Laptops / small desktops
 * - `xl`  - Extra large  (≥ 1280px)  - Desktops
 * - `2xl` - 2X large     (≥ 1536px)  - Large / wide-screen desktops
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Returns the current screen size breakpoint based on `window.innerWidth`.
 * Updates reactively on window resize.
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    getBreakpoint(window.innerWidth),
  );

  useEffect(() => {
    const onChange = () => setBreakpoint(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', onChange);
    return () => window.removeEventListener('resize', onChange);
  }, []);

  return breakpoint;
}
