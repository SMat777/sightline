import type { FindingType } from "../../tool-types";

export type Bias = "rang" | "overraskelse" | "sikkerhed";

const biasLabel: Record<Bias, string> = {
  rang: "Rang",
  overraskelse: "Mest overraskende",
  sikkerhed: "Mest sikre",
};

// Light, opinionated modulation of the feed: filter by signal type and re-bias
// the ordering. No full query builder — only valid choices are offered.
export default function LensSelector({
  types, activeType, onType, bias, onBias,
}: {
  types: FindingType[];
  activeType: FindingType | "alle";
  onType: (t: FindingType | "alle") => void;
  bias: Bias;
  onBias: (b: Bias) => void;
}) {
  return (
    <div className="lens" role="group" aria-label="Filtrér og vægt fund">
      <span className="tag lens-lab">Linse</span>
      <button
        className="chip" aria-pressed={activeType === "alle"}
        onClick={() => onType("alle")}
      >
        Alle
      </button>
      {types.map((t) => (
        <button
          key={t} className="chip" aria-pressed={activeType === t}
          onClick={() => onType(t)}
        >
          {t}
        </button>
      ))}
      <span className="lens-sep" aria-hidden="true" />
      {(Object.keys(biasLabel) as Bias[]).map((b) => (
        <button
          key={b} className="chip chip-bias" aria-pressed={bias === b}
          onClick={() => onBias(b)}
        >
          {biasLabel[b]}
        </button>
      ))}
    </div>
  );
}
