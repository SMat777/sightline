// One place for every number/label format so the UI reads consistently.

// Locale integer/decimal, e.g. 6031247 -> "6.031.247".
export const daNum = (v: number, decimals = 0) =>
  v.toLocaleString("da-DK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Compact big numbers for hero figures: 6031247 -> "6,0 mio", 644431 -> "644 t".
export const compact = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${daNum(v / 1_000_000, 1)} mio`;
  if (abs >= 10_000) return `${daNum(Math.round(v / 1000))} t`;
  return daNum(Math.round(v));
};

// Share 0..1 -> "26%".
export const pct = (v: number, decimals = 0) => `${daNum(v * 100, decimals)}%`;

// Signed percentage value (already in percent), e.g. 6.1 -> "+6,1%".
export const signedPct = (v: number) => `${v >= 0 ? "+" : ""}${daNum(v, 1)}%`;
