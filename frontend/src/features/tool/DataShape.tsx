import type { DatasetProfile } from "../../tool-types";

const roleClass: Record<string, string> = {
  Maal: "shape-maal",
  Dimension: "shape-dimension",
  Tid: "shape-tid",
};

// At-a-glance shape of the dataset: distinct values per column. A sqrt scale
// keeps flat columns (totals = 1) visible while rich ones stretch out, so you
// read instantly which columns carry signal and which are constant.
export default function DataShape({ profile }: { profile: DatasetProfile }) {
  const max = Math.max(...profile.columns.map((c) => c.cardinality), 1);

  return (
    <div className="shape" aria-label="Datasættets form — distinkte værdier pr. kolonne">
      {profile.columns.map((c) => {
        const w = Math.max(4, Math.round((Math.sqrt(c.cardinality) / Math.sqrt(max)) * 100));
        return (
          <div className="shape-row" key={c.name}>
            <span className="shape-name mono">{c.name}</span>
            <span className="shape-track">
              <span className={`shape-bar ${roleClass[c.role]}`} style={{ width: `${w}%` }} />
            </span>
            <span className="shape-val mono tnum">{c.cardinality.toLocaleString("da-DK")}</span>
          </div>
        );
      })}
    </div>
  );
}
