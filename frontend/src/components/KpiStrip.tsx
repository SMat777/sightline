import type { ZoneKpi } from "../types";
import { krKwh, gCo2 } from "../lib/format";

interface Props {
  kpis: ZoneKpi;
}

interface Stat {
  label: string;
  value: string;
  unit: string;
  hint: string;
}

// Four headline numbers: the current pulse plus today's cheapest moment.
export default function KpiStrip({ kpis }: Props) {
  const stats: Stat[] = [
    { label: "Pris nu", value: krKwh(kpis.currentPrice), unit: "kr/kWh", hint: "Spotpris denne time" },
    { label: "CO₂ nu", value: gCo2(kpis.currentCo2), unit: "g/kWh", hint: "Udledning denne time" },
    { label: "Billigst i dag", value: kpis.cheapestHour, unit: `${krKwh(kpis.cheapestPrice)} kr`, hint: "Dagens laveste pris" },
    { label: "Vedvarende", value: Math.round(kpis.renewableSharePct).toString(), unit: "% vind+sol", hint: "Andel grøn strøm nu" },
  ];

  return (
    <div className="kpistrip">
      {stats.map((s) => (
        <div key={s.label} className="kpi" role="group" aria-label={`${s.label}: ${s.value} ${s.unit}. ${s.hint}`}>
          <p className="kpi-label">{s.label}</p>
          <p className="kpi-value">
            {s.value}
            <span className="kpi-unit">{s.unit}</span>
          </p>
          <p className="kpi-hint">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}
