import type { NamedSeries } from "../../tool-types";
import { compact, daNum } from "../../lib/format";

const COLORS = ["#5c6a38", "#93733a", "#232319"];   // olive, tan, ink
const DASHES = ["", "7 4", "2 4"];                   // a11y: differentiate by line style, not colour alone

const W = 760;
const H = 260;
const L = 64;
const R = 120;   // room for inline series labels
const T = 16;
const B = 30;

// Top-segments over time as separate lines. Distinct dash patterns per series so
// the chart reads without relying on colour (chart-guideline a11y).
export default function MultiLineChart({ series }: { series: NamedSeries[] }) {
  const top = series.slice(0, 3);
  const len = Math.max(...top.map((s) => s.points.length), 1);
  const all = top.flatMap((s) => s.points.map((p) => p.value));
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => L + (i / Math.max(1, len - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / span) * (H - T - B);
  const labels = top[0]?.points ?? [];

  return (
    <div className="chartcard">
      <svg className="linechart" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Top ${top.length} segmenter over tid: ${top.map((s) => s.key).join(", ")}.`}>
        {[max, (max + min) / 2, min].map((v, i) => (
          <g key={i}>
            <line x1={L} y1={y(v)} x2={W - R} y2={y(v)} stroke="rgba(35,35,25,0.27)" strokeWidth="1" strokeDasharray="4 5" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontFamily="DM Mono" fontSize="11" fill="#232319">{compact(v)}</text>
          </g>
        ))}
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="#232319" strokeWidth="2" />
        {top.map((s, si) => {
          const d = s.points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
          const lastY = y(s.points[s.points.length - 1]?.value ?? min);
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={COLORS[si]} strokeWidth="2.6" strokeDasharray={DASHES[si]} strokeLinejoin="round" strokeLinecap="round" />
              <text x={W - R + 8} y={lastY + 4} fontFamily="DM Mono" fontSize="10.5" fill={COLORS[si]}>{s.key.replace(/^Region /, "")}</text>
            </g>
          );
        })}
        {[0, Math.floor((len - 1) / 2), len - 1].map((i) => labels[i] && (
          <text key={i} x={x(i)} y={H - 9} textAnchor={i === 0 ? "start" : i === len - 1 ? "end" : "middle"}
            fontFamily="DM Mono" fontSize="11" fill="#232319">{labels[i].label}</text>
        ))}
      </svg>
      <div className="legend-line">
        {top.map((s, si) => (
          <span key={s.key} className="ll-item">
            <svg width="26" height="8" aria-hidden="true"><line x1="0" y1="4" x2="26" y2="4" stroke={COLORS[si]} strokeWidth="2.6" strokeDasharray={DASHES[si]} /></svg>
            {s.key} <b className="mono">{daNum(s.points[s.points.length - 1]?.value ?? 0)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
