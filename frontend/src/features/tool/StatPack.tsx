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

function StatCell({
  glyph, lab, value, ctx, feat = false, warn = false,
}: { glyph: string; lab: string; value: string; ctx?: string; feat?: boolean; warn?: boolean }) {
  return (
    <div className={`cell${feat ? " feat" : ""}${warn ? " warn" : ""}`}>
      <span className="glyphbadge" aria-hidden="true">{glyph}</span>
      <span className="cell-lab">{lab}</span>
      <span className="cell-v tnum">{value}</span>
      {ctx && <span className="cell-ctx tnum">{ctx}</span>}
    </div>
  );
}

// Honest fall-back: no rich pack, just the form profile — no invented numbers.
function Fallback({ stats, profile }: { stats: StatPackData; profile: DatasetProfile }) {
  const byRole = (r: string) => profile.columns.filter((c) => c.role === r).length;
  const reason = !stats.hasMeasure
    ? "Intet numerisk mål at aggregere — forbind et mål for at låse de store nøgletal op."
    : "Den rå form-profil — strukturen bag tallene.";
  return (
    <div className="fallback">
      <div className="fh"><span className="tg">FORM-PROFIL</span><strong>{profile.title}</strong></div>
      <p>{reason}</p>
      <div className="miniform">
        <span className="mf">{daNum(profile.rowCount)} rækker</span>
        <span className="mf">{profile.columns.length} kolonner</span>
        <span className="mf">{byRole("Maal")} mål</span>
        <span className="mf">{byRole("Dimension")} dimensioner</span>
        <span className="mf">{profile.period ? `tid: ${profile.period}` : "0 tidsakse"}</span>
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
          <button type="button" aria-pressed={!auto} onClick={() => setShowForm(true)}>Form-profil</button>
        </div>
      )}

      {auto && m ? (
        <div className="pack">
          <StatCell feat glyph="Σ" lab={`${m.column} i alt`} value={compact(m.sum)}
            ctx={`${daNum(m.count)} ${stats.hasDimension ? "segmenter" : "værdier"}${stats.yoYPct !== null ? ` · ${signedPct(stats.yoYPct)} ${stats.yoYLabel}` : ""}`} />
          <StatCell glyph="⌀" lab="Gennemsnit" value={daNum(m.mean)} ctx={`median ${daNum(m.median)}`} />
          <StatCell glyph="↑" lab="Højeste" value={daNum(m.max)} ctx={stats.topSegments[0]?.key} />
          <StatCell glyph="↓" lab="Laveste" value={daNum(m.min)} />
          {m.spanRatio !== null && <StatCell glyph="↔" lab="Spænd (top ÷ bund)" value={`×${daNum(m.spanRatio, 1)}`} />}
          <StatCell glyph="σ" lab="Std.afvigelse" value={daNum(m.stdDev)} />
          {stats.topShare !== null && <StatCell glyph="⊙" lab="Koncentration" value={pct(stats.topShare)}
            ctx={stats.gini !== null ? `Gini ${daNum(stats.gini, 2)} · top 20%` : "top 20%"} />}
          {stats.yoYPct !== null && <StatCell glyph="↗" lab="Ændring (år)" value={signedPct(stats.yoYPct)} ctx={stats.yoYLabel ?? undefined} />}
          <StatCell glyph="!" lab="Outliers" value={daNum(stats.outlierCount)} ctx="> 3σ fra snit" warn={stats.outlierCount > 0} />
        </div>
      ) : (
        <Fallback stats={stats} profile={profile} />
      )}
    </div>
  );
}
