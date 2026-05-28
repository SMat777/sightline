import type { StatPack, Finding, DatasetProfile } from "../../tool-types";
import { pickInsight } from "../../lib/insight";

export default function InsightHeadline({
  stats, findings, profile,
}: { stats: StatPack; findings: Finding[]; profile: DatasetProfile }) {
  return (
    <div className="insight" role="note">
      <span className="insight-ico" aria-hidden="true">“</span>
      <p>{pickInsight(stats, findings, profile)}</p>
    </div>
  );
}
