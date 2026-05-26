import { useState } from "react";
import type { StatPack as StatPackData, DatasetProfile } from "../../tool-types";
import { daNum, compact, pct, signedPct } from "../../lib/format";

// Detection chip — a role the profiler found (or didn't), never colour alone.
function RoleChip({ on, glyph, label }: { on: boolean; glyph: string; label: string }) {
  return (
    <span className={`rp${on ? "" : " off"}`}>
      <span aria-hidden="true">{on ? glyph : "—"}</span> {label}
    </span>
  );
}

// Inline trend sparkline — gives each stat-cell a "what's the shape" hint
// without re-rendering the full trend chart. Skipped when there's < 2 points.
function Sparkline({ points, height = 24 }: { points: number[]; height?: number }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const step = w / (points.length - 1);
  const d = points.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  const lastX = (points.length - 1) * step;
  const lastY = height - ((points[points.length - 1] - min) / range) * height;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2.2" fill="var(--p1)" />
    </svg>
  );
}

function StatCell({
  glyph, lab, value, ctx, feat = false, warn = false, series,
}: { glyph: string; lab: string; value: string; ctx?: string; feat?: boolean; warn?: boolean; series?: number[] }) {
  return (
    <div className={`cell${feat ? " feat" : ""}${warn ? " warn" : ""}`}>
      <span className="glyphbadge" aria-hidden="true">{glyph}</span>
      <span className="cell-lab">{lab}</span>
      <span className="cell-v tnum">{value}</span>
      {ctx && <span className="cell-ctx tnum">{ctx}</span>}
      {series && <Sparkline points={series} height={feat ? 38 : 26} />}
    </div>
  );
}

// Role pill — colour-coded badge mapping backend role names to short Danish.
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = { Maal: "Mål", Dimension: "Dim", Tid: "Tid" };
  const cls = role === "Maal" ? "rb-maal" : role === "Tid" ? "rb-tid" : "rb-dim";
  return <span className={`rb ${cls}`}>{map[role] ?? role}</span>;
}

// Struktur-view: per-column inventory with role badge, type, cardinality bar,
// null-ratio bar and (numeric) min/max. The fallback when there's no measure
// to aggregate AND the toggle-target when a user wants to inspect the schema.
function StructView({ stats, profile }: { stats: StatPackData; profile: DatasetProfile }) {
  const byRole = (r: string) => profile.columns.filter((c) => c.role === r).length;
  const maxCard = Math.max(...profile.columns.map((c) => c.cardinality), 1);
  const highNull = profile.columns.filter((c) => c.nullRatio > 0.5).length;
  const reason = !stats.hasMeasure
    ? "Intet numerisk mål at aggregere — udforsk strukturen herunder for at finde din vinkel."
    : "Strukturen bag tallene — kolonner, roller, kvalitet.";
  return (
    <div className="struct">
      <div className="struct-head">
        <div className="struct-title"><span className="tg">STRUKTUR</span><strong>{profile.title}</strong></div>
        <p className="struct-reason">{reason}</p>
      </div>

      <div className="struct-summary">
        <span className="ss-cell"><b>{daNum(profile.rowCount)}</b> rækker</span>
        <span className="ss-cell"><b>{profile.columns.length}</b> kolonner</span>
        <span className="ss-cell"><b>{byRole("Maal")}</b> mål</span>
        <span className="ss-cell"><b>{byRole("Dimension")}</b> dimensioner</span>
        <span className="ss-cell"><b>{byRole("Tid")}</b> tids-kolonner</span>
        {highNull > 0 && (
          <span className="ss-cell warn"><b>{highNull}</b> kolonner med null &gt; 50%</span>
        )}
      </div>

      <div className="struct-tbl-wrap">
        <table className="struct-tbl">
          <thead>
            <tr><th>Rolle</th><th>Kolonne</th><th>Type</th><th>Kardinalitet</th><th>Null-andel</th><th>Min — Max</th></tr>
          </thead>
          <tbody>
            {profile.columns.map((c) => (
              <tr key={c.name}>
                <td><RoleBadge role={c.role} /></td>
                <td className="cn">{c.name}</td>
                <td className="ty">{c.type}</td>
                <td>
                  <div className="qbar">
                    <div className="qbar-track"><span className="qbar-fill p1" style={{ width: `${(c.cardinality / maxCard) * 100}%` }} /></div>
                    <span className="qbar-lab">{daNum(c.cardinality)}</span>
                  </div>
                </td>
                <td>
                  <div className="qbar">
                    <div className="qbar-track"><span className={`qbar-fill ${c.nullRatio > 0.5 ? "warn" : "p2"}`} style={{ width: `${Math.max(c.nullRatio * 100, 2)}%` }} /></div>
                    <span className="qbar-lab">{pct(c.nullRatio, 1)}</span>
                  </div>
                </td>
                <td className="mn">{c.min !== null && c.max !== null ? `${daNum(c.min)} — ${daNum(c.max)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StatPack({ stats, profile }: { stats: StatPackData; profile: DatasetProfile }) {
  const [showForm, setShowForm] = useState(false);
  const m = stats.measure;
  const canAuto = stats.hasMeasure && m !== null;
  const auto = canAuto && !showForm;

  return (
    <div>
      <div className="detect" role="status">
        <svg className="ico" viewBox="0 0 26 26" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
        <span className="txt">
          {canAuto
            ? <>Form genkendt → stat-pack regnet for <b>{daNum(stats.segmentCount || stats.rowCount)}</b> {stats.hasDimension ? "segmenter" : "datapunkter"}.</>
            : <>Kun struktur fundet — ingen tal at aggregere.</>}
        </span>
        <span className="roles">
          <RoleChip on={stats.hasMeasure} glyph="↗" label="mål" />
          <RoleChip on={stats.hasDimension} glyph="◆" label="dim" />
          <RoleChip on={stats.hasTime} glyph="◷" label="tid" />
        </span>
      </div>

      {canAuto && (
        <div className="seg seg-sm" role="group" aria-label="Visning">
          <button type="button" aria-pressed={auto} onClick={() => setShowForm(false)}>Auto stat-pack</button>
          <button type="button" aria-pressed={!auto} onClick={() => setShowForm(true)}>Struktur</button>
        </div>
      )}

      {auto && m ? (
        <div className="pack">
          {(() => {
            // One series shared across the time-aware cells. Empty for datasets without time.
            const series = stats.hasTime && stats.series.length > 1 ? stats.series.map((p) => p.value) : undefined;
            return <>
              <StatCell feat glyph="Σ" lab={`${m.column} i alt`} value={compact(m.sum)}
                ctx={`${daNum(m.count)} ${stats.hasDimension ? "segmenter" : "værdier"}${stats.yoYPct !== null ? ` · ${signedPct(stats.yoYPct)} ${stats.yoYLabel}` : ""}`}
                series={series} />
              <StatCell glyph="⌀" lab="Gennemsnit" value={daNum(m.mean)} ctx={`median ${daNum(m.median)}`} series={series} />
              <StatCell glyph="↑" lab="Højeste" value={daNum(m.max)} ctx={stats.topSegments[0]?.key} series={series} />
              <StatCell glyph="↓" lab="Laveste" value={daNum(m.min)} series={series} />
              {m.spanRatio !== null && <StatCell glyph="↔" lab="Spænd (top ÷ bund)" value={`×${daNum(m.spanRatio, 1)}`} />}
              <StatCell glyph="σ" lab="Std.afvigelse" value={daNum(m.stdDev)} />
              {stats.topShare !== null && <StatCell glyph="⊙" lab="Koncentration" value={pct(stats.topShare)}
                ctx={stats.gini !== null ? `Gini ${daNum(stats.gini, 2)} · top 20%` : "top 20%"} />}
              {stats.yoYPct !== null && <StatCell glyph="↗" lab="Ændring (år)" value={signedPct(stats.yoYPct)} ctx={stats.yoYLabel ?? undefined} />}
              <StatCell glyph="!" lab="Outliers" value={daNum(stats.outlierCount)} ctx="> 3σ fra snit" warn={stats.outlierCount > 0} />
            </>;
          })()}
        </div>
      ) : (
        <StructView stats={stats} profile={profile} />
      )}
    </div>
  );
}
