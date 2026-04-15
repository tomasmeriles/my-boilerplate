import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '~/hooks/use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update immediately when value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'hello' } },
    );
    rerender({ value: 'world' });
    expect(result.current).toBe('hello');
  });

  it('updates after the delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'hello' } },
    );
    rerender({ value: 'world' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('world');
  });

  it('resets the timer when value changes during delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );
    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('c');
  });
});
