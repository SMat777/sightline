import type { DatasetProfile } from "../../tool-types";

// The "what am I looking at" KPI row, in the locked dashboard's frame language.
export default function DataProfileStrip({ profile }: { profile: DatasetProfile }) {
  const dims = profile.columns.filter((c) => c.role === "Dimension").length;
  const maal = profile.columns.filter((c) => c.role === "Maal").length;

  let years = "—";
  if (profile.period) {
    const [start, end] = profile.period.split(" – ");
    years = end ? `${start.slice(0, 4)}–${end.slice(0, 4)}` : start;
  }

  const cards = [
    { lab: "Rækker", v: profile.rowCount.toLocaleString("da-DK"), meta: "datapunkter" },
    { lab: "Dimensioner", v: String(dims), meta: "at segmentere på" },
    { lab: "Mål", v: String(maal), meta: "at måle" },
    { lab: "Periode", v: years, meta: profile.period ?? "uden tidsakse" },
  ];

  return (
    <div className="kpis" aria-label="Datasæt-profil">
      {cards.map((k) => (
        <div className="kpi" key={k.lab}>
          <div className="tag">{k.lab}</div>
          <div className="v tnum">{k.v}</div>
          <div className="meta tnum">{k.meta}</div>
        </div>
      ))}
    </div>
  );
}
