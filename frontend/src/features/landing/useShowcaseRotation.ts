import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

type Opts = { count: number; intervalMs?: number; paused?: boolean };

export function useShowcaseRotation({
  count,
  intervalMs = 4000,
  paused = false,
}: Opts) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const isPaused = paused || reduced || count < 2;

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % count),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [isPaused, count, intervalMs]);

  return { index, setIndex, paused: isPaused };
}
