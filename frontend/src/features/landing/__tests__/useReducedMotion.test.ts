import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "../useReducedMotion";

test("returns false when matchMedia doesn't match", () => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
  const { result } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(false);
});

test("returns true when matchMedia matches", () => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
  const { result } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(true);
});
