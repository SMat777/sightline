const STEPS = [
  {
    n: "01 · VÆLG",
    t: "Vælg emne eller søg",
    p: "9 emner eller fri-tekstsøgning på tværs af 250+ datasæt fra DST og Open Data DK.",
  },
  {
    n: "02 · PROFILÉR",
    t: "Sightline aflæser",
    p: "Strukturen, måleenhederne og tidsaksen opdages automatisk. Nøgletal beregnes.",
  },
  {
    n: "03 · HISTORIE",
    t: "Du får din historie",
    p: "Nøgletal, trend-graf, segmenter, fund-cards og kontekst — klar til at fortolke.",
  },
] as const;

export default function HowItWorks() {
  return (
    <section className="how-works" aria-label="Sådan virker det">
      {STEPS.map((s, i) => (
        <div key={s.n} className="how-card">
          <span className="step">{s.n}</span>
          <h3>{s.t}</h3>
          <p>{s.p}</p>
          {i < STEPS.length - 1 && (
            <span className="arrow" aria-hidden="true">→</span>
          )}
        </div>
      ))}
    </section>
  );
}
