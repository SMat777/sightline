import type { Anomaly } from "../types";
import { krKwh, hhmm } from "../lib/format";

interface Props {
  anomalies: Anomaly[];
}

// Negative prices and spikes, flagged calmly with shape + colour + text.
export default function AnomalyList({ anomalies }: Props) {
  return (
    <section className="panel anomalies" aria-label="Afvigelser">
      <p className="panel-kicker">Afvigelser i dag</p>

      {anomalies.length === 0 ? (
        <p className="anom-empty">
          <span className="anom-empty-icon" aria-hidden="true">✓</span>
          Ingen afvigelser — en rolig dag.
        </p>
      ) : (
        <ul className="anom-list">
          {anomalies.map((a) => {
            const negative = a.spotPriceDkkKwh < 0;
            return (
              <li key={a.timestamp} className={`anom${negative ? " neg" : " spike"}`}>
                <span className="anom-icon" aria-hidden="true">{negative ? "↓" : "▲"}</span>
                <span className="anom-time">{hhmm(a.timestamp)}</span>
                <span className="anom-body">
                  <span className="anom-price">{krKwh(a.spotPriceDkkKwh)} kr/kWh</span>
                  <span className="anom-reason">{a.reason}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
