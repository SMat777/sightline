import { useState } from "react";
import type { Segment } from "../../tool-types";
import { compact, daNum, pct } from "../../lib/format";

// Sequential value scale: light honey (low) -> dark olive (high). SVG/inline need hex.
const SHADES = ["#d59a2c", "#bf9c45", "#93733a", "#6f7a44", "#5c6a38"];
const shadeOf = (v: number, min: number, max: number) =>
  SHADES[Math.min(4, Math.round(((v - min) / (max - min || 1)) * 4))];
const isDark = (v: number, min: number, max: number) =>
  ((v - min) / (max - min || 1)) >= 0.55;

// "Store dejlige decks": area cards coloured by value, 6 (3×2) by default, expandable.
export function AreaDeck({ segments }: { segments: Segment[] }) {
  const [open, setOpen] = useState(false);
  const max = segments[0]?.value ?? 1;
  const min = segments[segments.length - 1]?.value ?? 0;
  const shown = open ? segments : segments.slice(0, 6);
  return (
    <div>
      <div className="deck" role="img" aria-label={`${segments.length} områder farvet efter værdi, højest øverst.`}>
        {shown.map((s) => (
          <div className="deck-card" key={s.key}
            style={{ background: shadeOf(s.value, min, max), color: isDark(s.value, min, max) ? "#fff" : "#232319" }}>
            <span className="dc-name">{s.key}</span>
            <span className="dc-val tnum">{compact(s.value)}</span>
            <span className="dc-share tnum">{pct(s.share)}</span>
          </div>
        ))}
      </div>
      <div className="deck-foot">
        <div className="deck-scale" aria-hidden="true">
          <span className="ds-lab mono">lav</span>
          {SHADES.map((c) => <i key={c} style={{ background: c }} />)}
          <span className="ds-lab mono">høj</span>
        </div>
        {segments.length > 6 && (
          <button type="button" className="deck-more" onClick={() => setOpen(!open)}>
            {open ? "Vis færre" : `Vis alle (${segments.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

// Part-to-whole: 100 squares filled by each top segment's share, rest = "øvrige".
export function Waffle({ segments }: { segments: Segment[] }) {
  const top = segments.slice(0, 5);
  const palette = ["#5c6a38", "#6f7a44", "#93733a", "#bf9c45", "#d59a2c"];
  const counts = top.map((s) => Math.round(s.share * 100));
  const rest = Math.max(0, 100 - counts.reduce((a, b) => a + b, 0));
  const cells: string[] = [];
  top.forEach((_, i) => { for (let k = 0; k < counts[i]; k++) cells.push(palette[i]); });
  for (let k = 0; k < rest; k++) cells.push("#cdbf9e");
  return (
    <div className="waffle-wrap">
      <div className="waffle" role="img" aria-label={`Andel pr. segment: ${top.map((s) => `${s.key} ${pct(s.share)}`).join(", ")}.`}>
        {cells.slice(0, 100).map((c, i) => <span key={i} style={{ background: c }} />)}
      </div>
      <div className="waffle-legend">
        {top.map((s, i) => (
          <span key={s.key} className="wl"><i style={{ background: palette[i] }} />{s.key} <b className="mono">{pct(s.share)}</b></span>
        ))}
        {rest > 0 && <span className="wl"><i style={{ background: "#cdbf9e" }} />øvrige <b className="mono">{rest}%</b></span>}
      </div>
    </div>
  );
}

// Each segment vs a shared benchmark (the mean) — one continuous line across all
// bars, protruding minimally top & bottom, same width & colour throughout.
export function BulletChart({ segments, mean, label }: { segments: Segment[]; mean: number; label: string }) {
  const rows = segments.slice(0, 8);
  const max = rows[0]?.value ?? 1;
  const W = 760, L = 168, RV = 72, T = 12, rowH = 24, gap = 12;
  const barW = W - L - RV;
  const H = T * 2 + rows.length * rowH + (rows.length - 1) * gap;
  const bx = L + Math.min(1, mean / max) * barW;
  const lineTop = T - 6;
  const lineBot = T + rows.length * rowH + (rows.length - 1) * gap + 6;

  return (
    <div className="chartcard">
      <svg className="linechart" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`${label} pr. segment mod landsgennemsnit ${daNum(mean)}.`}>
        {rows.map((s, i) => {
          const y = T + i * (rowH + gap);
          return (
            <g key={s.key} fontFamily="DM Mono" fontSize="11" fill="#232319">
              <text x={0} y={y + rowH / 2 + 4} fontFamily="Space Grotesk" fontSize="12">{s.key}</text>
              <rect x={L} y={y} width={barW} height={rowH} fill="#ebe2cc" stroke="#232319" strokeWidth="2" />
              <rect x={L} y={y} width={(s.value / max) * barW} height={rowH} fill="#5c6a38" />
              <text x={W} y={y + rowH / 2 + 4} textAnchor="end">{compact(s.value)}</text>
            </g>
          );
        })}
        {/* single shared benchmark line, protruding equally top & bottom */}
        <line x1={bx} y1={lineTop} x2={bx} y2={lineBot} stroke="#df5a1e" strokeWidth="3" />
      </svg>
      <p className="panel-note mono"><span style={{ color: "#df5a1e" }}>▮</span> landsgennemsnit {daNum(mean)} · søjle = segmentets værdi</p>
    </div>
  );
}
