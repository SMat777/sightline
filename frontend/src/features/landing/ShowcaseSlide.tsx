import { compact, daNum, signedPct, pct } from "../../lib/format";
import { pickInsight } from "../../lib/insight";
import type { StatPack, DatasetProfile, Finding } from "../../tool-types";
import Sparkline from "./Sparkline";

type Props = {
  profile: DatasetProfile;
  stats: StatPack;
  findings: Finding[];
  active: boolean;
  topic: string;
};

export default function ShowcaseSlide({
  profile, stats, findings, active, topic,
}: Props) {
  const m = stats.measure;
  if (!m) return null;
  const top = stats.topSegments[0];
  const bot = stats.topSegments[stats.topSegments.length - 1];
  const showKonc = stats.topShare !== null;
  const insight = pickInsight(stats, findings, profile);
  return (
    <article className={`slide${active ? " is-active" : ""}`} aria-hidden={!active}>
      <div className="slide-head">
        <span className="id">{profile.id.replace("dst:", "")} · DST</span>
        <span className="title">{profile.title}</span>
        <span className="topic">{topic}</span>
      </div>
      <div className="slide-insight" role="note">{insight}</div>
      <div className="slide-cells six">
        <Cell feat lab={`${m.column} i alt`} value={compact(m.sum)}
          ctx={`${daNum(stats.segmentCount)} segmenter${stats.yoYPct !== null ? ` · ${signedPct(stats.yoYPct)} ${stats.yoYLabel}` : ""}`}
          hint={`${compact(m.sum)} samlet på tværs af ${daNum(m.count)} segmenter.`} />
        <Cell lab="Gennemsnit" value={daNum(m.mean)} ctx={`median ${daNum(m.median)}`}
          hint={`${daNum(m.mean)} i snit per segment. Median ${daNum(m.median)}.`} />
        <Cell lab="Maksimum" value={daNum(m.max)} ctx={top?.key}
          hint={top?.key ? `${daNum(m.max)} hos ${top.key}.` : `${daNum(m.max)} — højeste observation.`} />
        <Cell lab="Minimum" value={daNum(m.min)} ctx={bot?.key && stats.topSegments.length > 1 ? bot.key : undefined}
          hint={bot?.key && stats.topSegments.length > 1 ? `${daNum(m.min)} hos ${bot.key}.` : `${daNum(m.min)} — laveste observation.`} />
        {m.spanRatio !== null && (
          <Cell lab="Spændvidde" value={`×${daNum(m.spanRatio, 1)}`} ctx="max ÷ min"
            hint={`Højeste er ×${daNum(m.spanRatio, 1)} så stor som laveste.`} />
        )}
        {showKonc && (
          <Cell lab="Koncentration" value={pct(stats.topShare as number)}
            ctx={stats.gini !== null ? `Gini ${daNum(stats.gini, 2)} · top 20%` : "top 20%"}
            hint={`Top 20% af segmenter rummer ${pct(stats.topShare as number)} af totalen.`} />
        )}
      </div>
      <Sparkline series={stats.series} label={`${m.column} · ${profile.period ?? ""}`} />
    </article>
  );
}

function Cell({
  lab, value, ctx, hint, feat = false,
}: { lab: string; value: string; ctx?: string; hint: string; feat?: boolean }) {
  return (
    <div className={`sc${feat ? " feat" : ""}`}>
      <span className="l">
        {lab}
        <span className="q" tabIndex={0} role="button" aria-label={`Forklaring: ${lab}`}>
          ?<span className="qtip" role="tooltip">{hint}</span>
        </span>
      </span>
      <span className="v">{value}</span>
      {ctx && <span className="x">{ctx}</span>}
    </div>
  );
}
