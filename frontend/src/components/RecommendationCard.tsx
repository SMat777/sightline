import type { BestWindow } from "../types";

interface Props {
  best: BestWindow | null;
}

// The single actionable takeaway: when to actually use power today.
export default function RecommendationCard({ best }: Props) {
  if (!best) {
    return (
      <section className="panel reco reco-empty" aria-label="Anbefaling">
        <h2 className="panel-kicker">Anbefaling</h2>
        <p className="reco-empty-text">Ikke nok data til at finde et vindue endnu.</p>
      </section>
    );
  }

  return (
    <section className="panel reco" aria-label="Anbefaling">
      <h2 className="panel-kicker">Bedste vindue i dag</h2>
      <p className="reco-window">
        <span className="reco-icon" aria-hidden="true">✦</span>
        {best.start}<span className="reco-dash">–</span>{best.end}
      </p>
      <p className="reco-text">{best.text}</p>
      <div className="reco-score">
        <span className="reco-score-num">{Math.round(best.avgScore)}</span>
        <span className="reco-score-lbl">gns. score / 100</span>
      </div>
    </section>
  );
}
