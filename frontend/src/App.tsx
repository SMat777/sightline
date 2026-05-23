import { useEffect, useState } from "react";
import { fetchRadar } from "./api";
import type { RadarDay } from "./types";

export default function App() {
  const [radar, setRadar] = useState<RadarDay | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRadar()
      .then(setRadar)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  return (
    <div className="app">
      <header className="hero">
        <div className="wrap">
          <p className="eyebrow">Sightline · Energy Decision Radar</p>
          <h1>When is power cheap and green?</h1>
          <p className="sub">
            Hourly Danish electricity scored on price and CO₂ — with the best window to
            use power and the wind→price story behind it.
          </p>
        </div>
      </header>

      <main className="wrap">
        {error && <p className="state err">Could not reach the API: {error}</p>}
        {!error && !radar && <p className="state">Loading…</p>}
        {radar && (
          <p className="state">
            Connected · {radar.date} · {radar.zones.length} zones ·{" "}
            {radar.zones[0]?.hours.length ?? 0} hours each. The Decision Radar interface lands
            in the next phase.
          </p>
        )}
      </main>

      <footer className="foot wrap">
        Sightline · React + TS → .NET 10 → Postgres · Editorial Cream
      </footer>
    </div>
  );
}
