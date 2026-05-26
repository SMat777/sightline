import type { StatPack, Finding, DatasetProfile } from "../../tool-types";
import { daNum, pct, signedPct } from "../../lib/format";

// 1-liner that gives the dataset a verbal "what's the story" — picks the
// signal engine's top finding when available, else weaves the top segment
// and YoY into a single sentence, else falls back to a structural summary.
function pickInsight(stats: StatPack, findings: Finding[], profile: DatasetProfile): string {
  if (findings.length > 0) return findings[0].overskrift;

  const top = stats.topSegments[0];
  if (top && stats.topShare !== null && stats.measure) {
    const share = pct(top.share);
    const yoy = stats.yoYPct !== null
      ? ` — ${signedPct(stats.yoYPct)}${stats.yoYLabel ? ` ${stats.yoYLabel}` : ""}`
      : "";
    return `${top.key} tegner sig for ${share} af det samlede ${stats.measure.column.toLowerCase()}${yoy}.`;
  }

  if (stats.measure && stats.yoYPct !== null) {
    return `${stats.measure.column} ændrede sig ${signedPct(stats.yoYPct)}${stats.yoYLabel ? ` ${stats.yoYLabel}` : ""}.`;
  }

  const dims = stats.hasDimension ? `${daNum(stats.segmentCount)} segmenter` : `${profile.columns.length} kolonner`;
  return `${daNum(profile.rowCount)} rækker fordelt over ${dims} — klar til at udforske.`;
}

export default function InsightHeadline({
  stats, findings, profile,
}: { stats: StatPack; findings: Finding[]; profile: DatasetProfile }) {
  const text = pickInsight(stats, findings, profile);
  return (
    <div className="insight" role="note">
      <span className="insight-ico" aria-hidden="true">“</span>
      <p>{text}</p>
    </div>
  );
}
