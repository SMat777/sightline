import { useEffect, useMemo, useState } from "react";
import { fetchRadar, fetchCorrelation } from "./api";
import type { RadarDay, Correlation } from "./types";
import KpiStrip from "./components/KpiStrip";
import Ribbon from "./components/Ribbon";
import RecommendationCard from "./components/RecommendationCard";
import AnomalyList from "./components/AnomalyList";
import ZoneTabs from "./components/ZoneTabs";
import CorrelationScatter from "./components/CorrelationScatter";
import Skeleton from "./components/Skeleton";

export default function App() {
  const [radar, setRadar] = useState<RadarDay | null>(null);
  const [correlation, setCorrelation] = useState<Correlation | null>(null);
  const [active, setActive] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Abort on unmount / StrictMode re-run so a stale response can't set state.
    const ctrl = new AbortController();
    Promise.all([fetchRadar(ctrl.signal), fetchCorrelation(ctrl.signal)])
      .then(([r, c]) => {
        setRadar(r);
        setCorrelation(c);
        setActive(r.zones[0]?.zoneId ?? "");
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return; // expected on cleanup, not an error
        setError(e instanceof Error ? e.message : "Ukendt fejl");
      });
    return () => ctrl.abort();
  }, []);

  // The radar returns both zones fully, so the tab switch is a local select —
  // no extra request needed for drill-down.
  const zone = useMemo(
    () => radar?.zones.find((z) => z.zoneId === active) ?? radar?.zones[0] ?? null,
    [radar, active],
  );

  return (
    <div className="app">
      <header className="hero">
        <div className="wrap hero-inner">
          <div>
            <p className="eyebrow">Sightline · Energy Decision Radar</p>
            <h1>Hvornår er strømmen billig og grøn?</h1>
            <p className="sub">
              Danske timepriser scoret på pris og CO₂ — med dagens bedste vindue og
              vind→pris-historien bag tallene.
            </p>
          </div>
          {radar && zone && (
            <ZoneTabs zones={radar.zones} active={zone.zoneId} onChange={setActive} />
          )}
        </div>
      </header>

      <main className="wrap">
        {/* polite announcement so screen-reader users know the data arrived */}
        <p className="sr-only" aria-live="polite">
          {zone ? `Dashboard indlæst for zone ${zone.zoneId}.` : ""}
        </p>

        {error && (
          <p className="state err" role="alert">
            Kunne ikke nå API'et: {error}. Er backend startet?
          </p>
        )}

        {!error && !radar && <Skeleton />}

        {radar && zone && (
          <div
            className="dash"
            id="dash-panel"
            role="tabpanel"
            aria-labelledby={`tab-${zone.zoneId}`}
            tabIndex={0}
          >
            <div className="dash-meta">
              <span className="dash-zone">{zone.zoneId} · {zone.zoneName}</span>
              <span className="dash-date">{zone.date}</span>
            </div>

            <div className="reveal r1">
              <KpiStrip kpis={zone.kpis} />
            </div>

            <div className="reveal r2 panel ribbon-panel">
              <Ribbon
                hours={zone.hours}
                bestStart={zone.bestWindow?.start ?? null}
                bestEnd={zone.bestWindow?.end ?? null}
              />
            </div>

            <div className="reveal r3 dash-two">
              <RecommendationCard best={zone.bestWindow} />
              <AnomalyList anomalies={zone.anomalies} />
            </div>

            {correlation && (
              <div className="reveal r4">
                <CorrelationScatter data={correlation} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="foot wrap">
        Sightline · React + TS → .NET 10 → Postgres · Editorial Cream ·{" "}
        <span className="foot-note">Demo-data (Fase 1A) — live ingestion i Fase 1B</span>
      </footer>
    </div>
  );
}
