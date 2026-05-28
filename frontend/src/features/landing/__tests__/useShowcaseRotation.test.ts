import { renderHook, act } from "@testing-library/react";
import { useShowcaseRotation } from "../useShowcaseRotation";

beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
});

afterEach(() => vi.useRealTimers());

test("advances index every intervalMs and wraps around", () => {
  const { result } = renderHook(() =>
    useShowcaseRotation({ count: 3, intervalMs: 1000 }),
  );
  expect(result.current.index).toBe(0);
  act(() => { vi.advanceTimersByTime(1000); });
  expect(result.current.index).toBe(1);
  act(() => { vi.advanceTimersByTime(1000); });
  expect(result.current.index).toBe(2);
  act(() => { vi.advanceTimersByTime(1000); });
  expect(result.current.index).toBe(0);
});

test("does not advance when paused", () => {
  const { result } = renderHook(() =>
    useShowcaseRotation({ count: 3, paused: true, intervalMs: 1000 }),
  );
  act(() => { vi.advanceTimersByTime(3000); });
  expect(result.current.index).toBe(0);
});

test("setIndex jumps to specific slide", () => {
  const { result } = renderHook(() => useShowcaseRotation({ count: 3 }));
  act(() => result.current.setIndex(2));
  expect(result.current.index).toBe(2);
});

test("does not cycle when reduced motion is on", () => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
  const { result } = renderHook(() =>
    useShowcaseRotation({ count: 3, intervalMs: 1000 }),
  );
  act(() => { vi.advanceTimersByTime(3000); });
  expect(result.current.index).toBe(0);
  expect(result.current.paused).toBe(true);
});
