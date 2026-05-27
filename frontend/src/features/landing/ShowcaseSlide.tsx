import { compact, daNum, signedPct, pct } from "../../lib/format";
import type { StatPack, DatasetProfile } from "../../tool-types";

type Props = {
  profile: DatasetProfile;
  stats: StatPack;
  active: boolean;
  topic: string;
};

export default function ShowcaseSlide({ profile, stats, active, topic }: Props) {
  const m = stats.measure;
  if (!m) return null;
  const top = stats.topSegments[0];
  const showKonc = stats.topShare !== null;
  return (
    <article className={`slide${active ? " is-active" : ""}`} aria-hidden={!active}>
      <div className="slide-head">
        <span className="id">{profile.id.replace("dst:", "")} · DST</span>
        <span className="title">{profile.title}</span>
        <span className="topic">{topic}</span>
      </div>
      <div className="slide-cells">
        <div className="sc feat">
          <span className="l">{m.column} I ALT</span>
          <span className="v">{compact(m.sum)}</span>
          <span className="x">
            {daNum(stats.segmentCount)} segmenter
            {stats.yoYPct !== null && ` · ${signedPct(stats.yoYPct)} ${stats.yoYLabel}`}
          </span>
        </div>
        <div className="sc">
          <span className="l">MAKSIMUM</span>
          <span className="v">{daNum(m.max)}</span>
          {top && <span className="x">{top.key}</span>}
        </div>
        <div className="sc">
          <span className="l">{showKonc ? "KONCENTRATION" : "SPÆNDVIDDE"}</span>
          <span className="v">
            {showKonc
              ? pct(stats.topShare as number)
              : `×${daNum(m.spanRatio ?? 1, 1)}`}
          </span>
          <span className="x">
            {stats.gini !== null
              ? `Gini ${daNum(stats.gini, 2)} · top 20%`
              : showKonc
                ? "top 20%"
                : "max ÷ min"}
          </span>
        </div>
      </div>
    </article>
  );
}
