import { useState } from "react";
import type { Hour } from "../types";
import { krKwh, gCo2, hhmm, hourOf, statusMeta } from "../lib/format";

interface Props {
  hours: Hour[];
  bestStart: string | null; // "HH:mm" of best-window start, for soft highlight
  bestEnd: string | null;
}

// Geometry in a fixed viewBox; CSS scales the SVG to its container width.
const VB_W = 960;
const VB_H = 220;
const PAD_X = 8;
const PLOT_TOP = 16;
const PLOT_BOT = 188; // baseline; below it sits the hour axis
const PLOT_H = PLOT_BOT - PLOT_TOP;

// The signature view: 24 hourly bars. Height encodes price (the evening spike
// towers), colour encodes status (cheap+green vs dear+fossil). Hand-rolled SVG
// for full control over the calm editorial look.
export default function Ribbon({ hours, bestStart, bestEnd }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  if (hours.length === 0) return null;

  const maxPrice = Math.max(...hours.map((h) => h.spotPriceDkkKwh), 0.01);
  const slot = (VB_W - PAD_X * 2) / hours.length;
  const barW = slot * 0.62;

  const startH = bestStart ? Number(bestStart.slice(0, 2)) : null;
  const endH = bestEnd ? Number(bestEnd.slice(0, 2)) : null;
  const inBest = (h: Hour) =>
    startH !== null && endH !== null && hourOf(h.timestamp) >= startH && hourOf(h.timestamp) <= endH;

  const x = (i: number) => PAD_X + i * slot + (slot - barW) / 2;
  const barH = (price: number) => Math.max(3, (price / maxPrice) * PLOT_H);

  const active = hover !== null ? hours[hover] : null;

  return (
    <figure className="ribbon-fig">
      <figcaption className="ribbon-cap">
        <span>Pris &amp; status — døgnets 24 timer</span>
        <span className="ribbon-legend">
          {(["Healthy", "Watch", "Critical"] as const).map((s) => (
            <span key={s} className="leg">
              <span className="leg-dot" style={{ background: statusMeta[s].color }} aria-hidden="true" />
              {statusMeta[s].label}
            </span>
          ))}
        </span>
      </figcaption>

      <div className="ribbon-wrap">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="ribbon-svg"
          role="img"
          aria-label={`Timepriser for døgnet. Dyreste ${krKwh(maxPrice)} kr/kWh. ${
            startH !== null ? `Bedste vindue ${bestStart}–${bestEnd}.` : ""
          }`}
          preserveAspectRatio="none"
        >
          {/* soft highlight behind the best window */}
          {hours.map((h, i) =>
            inBest(h) ? (
              <rect
                key={`best-${i}`}
                x={PAD_X + i * slot}
                y={PLOT_TOP - 6}
                width={slot}
                height={PLOT_H + 12}
                className="ribbon-best"
              />
            ) : null,
          )}

          {/* baseline */}
          <line x1={PAD_X} y1={PLOT_BOT} x2={VB_W - PAD_X} y2={PLOT_BOT} className="ribbon-base" />

          {/* bars */}
          {hours.map((h, i) => {
            const height = barH(h.spotPriceDkkKwh);
            return (
              <rect
                key={i}
                x={x(i)}
                y={PLOT_BOT - height}
                width={barW}
                height={height}
                rx={2}
                fill={statusMeta[h.status].color}
                className={`ribbon-bar${hover === i ? " hot" : ""}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
              />
            );
          })}

          {/* hour axis ticks every 3h */}
          {hours.map((h, i) =>
            hourOf(h.timestamp) % 3 === 0 ? (
              <text key={`t-${i}`} x={x(i) + barW / 2} y={PLOT_BOT + 22} className="ribbon-tick">
                {hhmm(h.timestamp)}
              </text>
            ) : null,
          )}
        </svg>

        {active && (
          <div
            className="ribbon-tip"
            style={{ left: `${((hover! + 0.5) / hours.length) * 100}%` }}
          >
            <span className="tip-time">{hhmm(active.timestamp)}</span>
            <span className="tip-row">
              <span className="tip-dot" style={{ background: statusMeta[active.status].color }} aria-hidden="true" />
              {statusMeta[active.status].label}
            </span>
            <span className="tip-line">{krKwh(active.spotPriceDkkKwh)} kr/kWh</span>
            <span className="tip-line tip-sub">{gCo2(active.co2IntensityGKwh)} g CO₂ · score {Math.round(active.score)}</span>
          </div>
        )}
      </div>

      {/* screen-reader fallback: the same data as a table */}
      <table className="sr-only">
        <caption>Timepriser og status for døgnet</caption>
        <thead>
          <tr><th>Time</th><th>Pris (kr/kWh)</th><th>CO₂ (g/kWh)</th><th>Status</th></tr>
        </thead>
        <tbody>
          {hours.map((h) => (
            <tr key={h.timestamp}>
              <td>{hhmm(h.timestamp)}</td>
              <td>{krKwh(h.spotPriceDkkKwh)}</td>
              <td>{gCo2(h.co2IntensityGKwh)}</td>
              <td>{statusMeta[h.status].label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
