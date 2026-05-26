import type { StatPack as StatPackData, DatasetProfile } from "../../tool-types";
import { daNum, compact, pct, signedPct } from "../../lib/format";

function StatCell({
  glyph, lab, value, ctx, feat = false, warn = false, hint,
}: { glyph?: string; lab: string; value: string; ctx?: string; feat?: boolean; warn?: boolean; hint?: string }) {
  return (
    <div className={`cell${feat ? " feat" : ""}${warn ? " warn" : ""}`}>
      {glyph && <span className="glyphbadge" aria-hidden="true">{glyph}</span>}
      <span className="cell-lab">
        {lab}
        {hint && (
          <span className="cell-info" tabIndex={0} role="button" aria-label={`Forklaring: ${lab}`}>
            ?<span className="cell-tip" role="tooltip">{hint}</span>
          </span>
        )}
      </span>
      <span className="cell-v tnum">{value}</span>
      {ctx && <span className="cell-ctx tnum">{ctx}</span>}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = { Maal: "Mål", Dimension: "Dim", Tid: "Tid" };
  const cls = role === "Maal" ? "rb-maal" : role === "Tid" ? "rb-tid" : "rb-dim";
  return <span className={`rb ${cls}`}>{map[role] ?? role}</span>;
}

// Shown only when the profiler found no numeric measure to aggregate —
// surfaces the dataset's structure as a fallback so the page isn't empty.
function StructView({ profile }: { profile: DatasetProfile }) {
  const byRole = (r: string) => profile.columns.filter((c) => c.role === r).length;
  const maxCard = Math.max(...profile.columns.map((c) => c.cardinality), 1);
  const highNull = profile.columns.filter((c) => c.nullRatio > 0.5).length;
  return (
    <div className="struct">
      <div className="struct-head">
        <div className="struct-title"><span className="tg">STRUKTUR</span><strong>{profile.title}</strong></div>
        <p className="struct-reason">Intet numerisk mål at aggregere — udforsk strukturen herunder for at finde din vinkel.</p>
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
  const m = stats.measure;
  if (!stats.hasMeasure || m === null) return <StructView profile={profile} />;

  const sumCtx = `${daNum(m.count)} ${stats.hasDimension ? "segmenter" : "værdier"}`
    + (stats.yoYPct !== null ? ` · ${signedPct(stats.yoYPct)} ${stats.yoYLabel}` : "");
  const yoYGlyph = stats.yoYPct !== null ? (stats.yoYPct >= 0 ? "↑" : "↓") : undefined;

  // Data-aware sentence builders. Bruger faktiske tal + dataset-kontekst,
  // ikke generiske statistik-definitioner. Falder tilbage til neutral
  // formulering hvis felter mangler.
  const unit = profile.unit ?? "";
  const unitLow = unit ? ` ${unit.toLowerCase()}` : "";
  const segLabel = stats.hasDimension ? "segmenter" : "observationer";
  const dataset = profile.title;
  const top = stats.topSegments[0];
  const bot = stats.topSegments[stats.topSegments.length - 1];
  const meanMedianDiff = m.median !== 0 ? ((m.mean - m.median) / m.median) * 100 : 0;
  const skewWord = Math.abs(meanMedianDiff) < 5
    ? "tæt på medianen — fordelingen er forholdsvis symmetrisk"
    : meanMedianDiff > 0
      ? "højere end medianen — fordelingen er trukket op af store værdier"
      : "lavere end medianen — fordelingen er trukket ned af små værdier";
  const giniWord = stats.gini === null ? "" : stats.gini < 0.25
    ? "en relativt jævn fordeling"
    : stats.gini < 0.5
      ? "en moderat skæv fordeling"
      : "en stærkt skæv fordeling med få dominerende aktører";

  return (
    <div className="pack">
      <StatCell feat lab={`${m.column} i alt`} value={compact(m.sum)}
        ctx={sumCtx}
        hint={`${compact(m.sum)}${unitLow} samlet på tværs af ${daNum(m.count)} ${segLabel} i perioden ${profile.period ?? "datasættet"}. Datasæt: ${dataset}.`} />
      <StatCell lab="Gennemsnit" value={daNum(m.mean)}
        ctx={`median ${daNum(m.median)}`}
        hint={`${daNum(m.mean)}${unitLow} i snit per ${stats.hasDimension ? "segment" : "observation"}. Medianen (${daNum(m.median)}) ligger ${skewWord}.`} />
      <StatCell glyph="↑" lab="Maksimum" value={daNum(m.max)}
        ctx={top?.key}
        hint={top?.key
          ? `${daNum(m.max)}${unitLow} hos ${top.key} — den højeste observation i ${dataset}.`
          : `${daNum(m.max)}${unitLow} — den højeste observation i ${dataset}.`} />
      <StatCell glyph="↓" lab="Minimum" value={daNum(m.min)}
        ctx={bot?.key && stats.topSegments.length > 1 ? bot.key : undefined}
        hint={bot?.key && stats.topSegments.length > 1
          ? `${daNum(m.min)}${unitLow} hos ${bot.key} — den laveste observation i ${dataset}.`
          : `${daNum(m.min)}${unitLow} — den laveste observation i ${dataset}.`} />
      {m.spanRatio !== null && <StatCell lab="Spændvidde" value={`×${daNum(m.spanRatio, 1)}`}
        ctx="max ÷ min"
        hint={top?.key && bot?.key && stats.topSegments.length > 1
          ? `${top.key} har ×${daNum(m.spanRatio, 1)} så mange${unitLow} som ${bot.key}. Skala-forskellen mellem top og bund.`
          : `Den højeste værdi er ×${daNum(m.spanRatio, 1)} så stor som den laveste. Skala-forskel mellem top og bund.`} />}
      <StatCell lab="Spredning" value={daNum(m.stdDev)}
        ctx="standardafvigelse"
        hint={`Værdierne ligger typisk ±${daNum(m.stdDev)}${unitLow} fra gennemsnittet (${daNum(m.mean)}). ${m.stdDev / Math.max(m.mean, 1) < 0.3 ? "Datasættet er forholdsvis homogent." : "Stor variation mellem observationer."}`} />
      {stats.topShare !== null && <StatCell lab="Koncentration" value={pct(stats.topShare)}
        ctx={stats.gini !== null ? `Gini ${daNum(stats.gini, 2)} · top 20%` : "top 20%"}
        hint={stats.gini !== null
          ? `De største 20% af ${segLabel} står for ${pct(stats.topShare)} af totalen — Gini ${daNum(stats.gini, 2)} indikerer ${giniWord}.`
          : `De største 20% af ${segLabel} står for ${pct(stats.topShare)} af totalen.`} />}
      {stats.yoYPct !== null && <StatCell glyph={yoYGlyph} lab="Årlig ændring" value={signedPct(stats.yoYPct)}
        ctx={stats.yoYLabel ?? undefined}
        hint={`${m.column} ${stats.yoYPct >= 0 ? "voksede" : "faldt"} ${signedPct(stats.yoYPct)} ${stats.yoYLabel ?? "år for år"}. ${Math.abs(stats.yoYPct) < 2 ? "Stabilt niveau." : Math.abs(stats.yoYPct) < 10 ? "Mærkbar bevægelse." : "Markant ændring — værd at undersøge nærmere."}`} />}
      <StatCell lab="Outliers" value={daNum(stats.outlierCount)}
        ctx={stats.outlierCount > 0 ? "> 3σ fra snit" : "ingen over 3σ"}
        warn={stats.outlierCount > 0}
        hint={stats.outlierCount === 0
          ? `Ingen observationer i ${dataset} er ekstreme (alle ligger inden for 3 standardafvigelser fra snittet) — datasættet er stabilt.`
          : `${daNum(stats.outlierCount)} observation${stats.outlierCount === 1 ? "" : "er"} ligger mere end 3 standardafvigelser fra snittet — særtilfælde eller potentielle datafejl der bør undersøges.`} />
    </div>
  );
}
