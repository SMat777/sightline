import type { TimePoint } from "../../tool-types";

type Props = { series: TimePoint[]; label: string };

// Inline SVG sparkline — 48px tall olive polyline.
// Returnerer null hvis < 2 punkter (intet at tegne).
export default function Sparkline({ series, label }: Props) {
  if (series.length < 2) return null;
  const vals = series.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const w = 600, h = 48;
  const step = w / (series.length - 1);
  const points = series
    .map((p, i) => `${(i * step).toFixed(1)},${(h - ((p.value - min) / range) * h).toFixed(1)}`)
    .join(" ");
  const first = series[0].value, last = series[series.length - 1].value;
  const pctChange = first === 0 ? 0 : ((last - first) / first) * 100;
  const sign = pctChange >= 0 ? "+" : "";
  return (
    <div className="slide-spark" aria-hidden="true">
      <span className="lab">{label}</span>
      <span className="rng">{sign}{pctChange.toFixed(1)}%</span>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline fill="none" stroke="#5c6a38" strokeWidth="2.2" points={points} />
      </svg>
    </div>
  );
}
