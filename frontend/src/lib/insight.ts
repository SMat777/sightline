import type { StatPack, Finding, DatasetProfile } from "../tool-types";
import { daNum, pct, signedPct } from "./format";

// Picks the one-liner that gives the dataset a verbal "what's the story".
// Fallback chain: top finding → top segment + YoY → YoY only → structural.
export function pickInsight(
  stats: StatPack, findings: Finding[], profile: DatasetProfile,
): string {
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

  const dims = stats.hasDimension
    ? `${daNum(stats.segmentCount)} segmenter`
    : `${profile.columns.length} kolonner`;
  return `${daNum(profile.rowCount)} rækker fordelt over ${dims} — klar til at udforske.`;
}
