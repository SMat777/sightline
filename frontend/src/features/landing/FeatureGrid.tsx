const FEATURES = [
  {
    n: "01",
    cls: "",
    t: "Bladr — eller søg",
    p: "9 kuraterede emner fra Borgere til Miljø. Find datasættet du leder efter på sekunder, eller fri-tekstsøg i hele kataloget.",
  },
  {
    n: "02",
    cls: "ic-hi",
    t: "Automatisk profil",
    p: "Sightline aflæser strukturen og regner gennemsnit, spændvidde, koncentration og outliers ud — uden at du skal kunne statistik.",
  },
  {
    n: "03",
    cls: "ic-ano",
    t: "Find historier",
    p: "Find-engine fremhæver trends, anomalier og koncentrationer i datasættet, så du ikke skal lede selv. Klik for kontekst.",
  },
] as const;

export default function FeatureGrid() {
  return (
    <section className="feat-grid" aria-label="Features">
      {FEATURES.map((f) => (
        <article key={f.n} className={`feat-card ${f.cls}`.trim()}>
          <div className="ic" aria-hidden="true">{f.n}</div>
          <h3>{f.t}</h3>
          <p>{f.p}</p>
        </article>
      ))}
    </section>
  );
}
