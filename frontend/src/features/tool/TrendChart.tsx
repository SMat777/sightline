import type { TimePoint } from "../../tool-types";
import { compact, daNum, signedPct } from "../../lib/format";

// SVG presentation attributes can't read CSS var() — use the locked palette hex
// (same approach as the dashboard's hand-rolled charts).
const OLIVE = "#5c6a38";
const HONEY = "#d59a2c";
const INK = "#232319";
const HAIR = "rgba(35,35,25,0.27)";
const ANO = "#a3431f"; // outlier marker — matches --ano-deep in riso.css

// Outliers in a time series: |value - mean| > 3σ. Returns the indices we
// should flag in the chart so a recruiter spots the unusual months instantly.
function outlierIndices(vals: number[]): number[] {
  if (vals.length < 4) return [];
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const sd = Math.sqrt(variance);
  if (sd === 0) return [];
  return vals
    .map((v, i) => (Math.abs(v - mean) > 3 * sd ? i : -1))
    .filter((i) => i >= 0);
}

const W = 760;
const H = 260;
const L = 64;   // left gutter for y labels
const R = 14;
const T = 16;
const B = 30;

// Measure-over-time line. A11y: line + an aria summary; the section also offers a
// data-table toggle (the accessible fallback the chart guidelines call for).
export default function TrendChart({ series, label }: { series: TimePoint[]; label: string }) {
  const vals = series.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => L + (i / Math.max(1, series.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / span) * (H - T - B);

  const line = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(1)} ${H - B} L${x(0).toFixed(1)} ${H - B} Z`;

  const first = series[0];
  const last = series[series.length - 1];
  const changePct = first.value !== 0 ? ((last.value - first.value) / Math.abs(first.value)) * 100 : 0;
  const outliers = outlierIndices(vals);

  // sparse x labels: first, last, and a few evenly spaced between
  const ticks = Math.min(5, series.length);
  const tickIdx = Array.from({ length: ticks }, (_, k) => Math.round((k / (ticks - 1)) * (series.length - 1)));

  return (
    <div className="chartcard">
      <svg
        className="linechart" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`${label} fra ${first.label} (${daNum(first.value)}) til ${last.label} (${daNum(last.value)}), ${signedPct(changePct)} over perioden${outliers.length ? `, ${outliers.length} outliers fundet` : ""}.`}
      >
        {/* y gridlines + labels at min, mid, max */}
        {[max, (max + min) / 2, min].map((v, i) => (
          <g key={i}>
            <line x1={L} y1={y(v)} x2={W - R} y2={y(v)} stroke={HAIR} strokeWidth="1" strokeDasharray="4 5" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontFamily="DM Mono" fontSize="11" fill={INK}>{compact(v)}</text>
          </g>
        ))}
        {/* baseline */}
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke={INK} strokeWidth="2" />
        {/* area + line */}
        <path d={area} fill={HONEY} opacity="0.16" />
        <path d={line} fill="none" stroke={OLIVE} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        {/* outliers — drawn before last marker so they sit under it visually */}
        {outliers.map((i) => (
          <g key={`o-${i}`}>
            <circle cx={x(i)} cy={y(series[i].value)} r="6.5" fill="none" stroke={ANO} strokeWidth="2.4" />
            <text x={x(i)} y={y(series[i].value) - 12} textAnchor="middle"
              fontFamily="DM Mono" fontSize="11" fontWeight="700" fill={ANO}>!</text>
          </g>
        ))}
        {/* last-point marker */}
        <circle cx={x(series.length - 1)} cy={y(last.value)} r="5" fill={OLIVE} />
        {/* x labels */}
        {tickIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 9} textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"}
            fontFamily="DM Mono" fontSize="11" fill={INK}>{series[i].label}</text>
        ))}
      </svg>
      {outliers.length > 0 && (
        <p className="chart-note">
          <span className="chart-note-pip" aria-hidden="true">●</span>
          {outliers.length} outlier{outliers.length === 1 ? "" : "s"} markeret — værdier &gt; 3σ fra gennemsnit
          ({outliers.slice(0, 3).map((i) => series[i].label).join(", ")}{outliers.length > 3 ? "…" : ""}).
        </p>
      )}
    </div>
  );
}
