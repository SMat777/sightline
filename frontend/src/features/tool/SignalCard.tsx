import type { Finding, Evidence } from "../../tool-types";

// SVG presentation attributes can't read CSS var() — use the locked palette hex
// directly (same approach as the locked dashboard mockup's hand-rolled charts).
const OLIVE = "#5c6a38";
const TAN = "#93733a";
const ANO = "#df5a1e";

const W = 480;
const H = 90;
const P = 6;

function Sparkline({ ev, anomaly, label }: { ev: Evidence; anomaly: boolean; label: string }) {
  const vals = ev.points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => P + (i / Math.max(1, ev.points.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - min) / span) * (H - 2 * P);
  const d = ev.points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const hi = ev.highlightIndex;

  return (
    <svg className="miniviz" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <path d={d} fill="none" stroke={OLIVE} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      {hi != null && (
        <circle
          cx={x(hi)} cy={y(ev.points[hi].value)} r="5.5"
          fill={anomaly ? ANO : "none"}
          stroke={anomaly ? ANO : OLIVE} strokeWidth="2.6"
        />
      )}
    </svg>
  );
}

function Bars({ ev, label }: { ev: Evidence; label: string }) {
  const vals = ev.points.map((p) => p.value);
  const max = Math.max(...vals) || 1;
  const gap = 6;
  const bw = (W - 2 * P - gap * (ev.points.length - 1)) / ev.points.length;

  return (
    <svg className="miniviz" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ev.points.map((p, i) => {
        const h = (p.value / max) * (H - 2 * P);
        return (
          <rect
            key={i} x={P + i * (bw + gap)} y={H - P - h} width={bw} height={h}
            fill={i === ev.highlightIndex ? OLIVE : TAN}
          >
            <title>{p.label}: {Math.round(p.value).toLocaleString("da-DK")}</title>
          </rect>
        );
      })}
    </svg>
  );
}

function MiniViz({ finding }: { finding: Finding }) {
  const label = `Bevis for: ${finding.overskrift}`;
  if (finding.bevis.viz === "bars") return <Bars ev={finding.bevis} label={label} />;
  return <Sparkline ev={finding.bevis} anomaly={finding.type === "Anomali"} label={label} />;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function SignalCard({
  finding, rank, hero = false,
}: { finding: Finding; rank: number; hero?: boolean }) {
  const i = finding.interessanthed;
  const dots = Math.max(0, Math.min(4, Math.round(i.sikkerhed * 4)));
  const type = finding.type.toLowerCase();

  return (
    <article className={`scard${hero ? " scard-hero" : ""}`}>
      <div className="scard-top">
        <span className={`stamp stamp-${type}`}>{finding.type}</span>
        <span className="scard-rank mono">#{rank}</span>
      </div>
      <h3 className="scard-head">{finding.overskrift}</h3>
      <MiniViz finding={finding} />
      <div className="scard-foot">
        <span className="strength" aria-label={`Styrke ${pct(i.styrke)}`}>
          <span className="strength-fill" style={{ width: pct(i.styrke) }} />
        </span>
        <span className="conf mono" aria-label={`Sikkerhed ${dots} af 4`} title="Sikkerhed">
          {"●".repeat(dots)}{"○".repeat(4 - dots)}
        </span>
      </div>
      <details className="scard-why">
        <summary className="mono">hvorfor #{rank}?</summary>
        <ul className="why-list">
          <li><span>Styrke</span><b className="mono">{pct(i.styrke)}</b></li>
          <li><span>Overraskelse</span><b className="mono">{pct(i.overraskelse)}</b></li>
          <li><span>Sikkerhed</span><b className="mono">{pct(i.sikkerhed)}</b></li>
          <li><span>Dækning</span><b className="mono">{pct(i.daekning)}</b></li>
        </ul>
      </details>
    </article>
  );
}
