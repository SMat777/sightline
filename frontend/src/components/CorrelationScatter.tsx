import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import type { Correlation } from "../types";
import { krKwh } from "../lib/format";

interface Props {
  data: Correlation;
}

// Least-squares fit so we can draw the trend the coefficient describes.
function regression(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

// Greener points (more wind+solar) cluster low-price / high-wind — the eye sees
// the negative slope the coefficient names.
const pointColor = (renewablePct: number) =>
  renewablePct >= 55 ? "var(--healthy)" : renewablePct >= 35 ? "var(--watch)" : "var(--muted)";

interface Row {
  wind: number;
  price: number;
  renew: number;
}

export default function CorrelationScatter({ data }: Props) {
  const rows: Row[] = data.points.map((p) => ({
    wind: p.windMs,
    price: p.spotPriceDkkKwh,
    renew: p.renewableSharePct,
  }));

  const xs = rows.map((r) => r.wind);
  const ys = rows.map((r) => r.price);
  const fit = regression(xs, ys);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  const r = data.coefficient;
  const strength = Math.abs(r) >= 0.7 ? "stærk" : Math.abs(r) >= 0.4 ? "moderat" : "svag";
  const direction = r < 0 ? "negativ" : "positiv";

  return (
    <section className="panel scatter" aria-label="Sammenhæng mellem vind og pris">
      <div className="scatter-head">
        <div>
          <p className="panel-kicker">Hvorfor — vind mod pris</p>
          <p className="scatter-sub">
            Hver prik er én time på tværs af begge zoner. Mere vind, lavere pris.
          </p>
        </div>
        <div className="scatter-coef" title={`Pearson r = ${r}`}>
          <span className="coef-num">{r.toFixed(2)}</span>
          <span className="coef-lbl">{strength} {direction} sammenhæng</span>
        </div>
      </div>

      <div className="scatter-plot">
        <ResponsiveContainer width="100%" height={340} minWidth={0}>
          <ScatterChart margin={{ top: 12, right: 16, bottom: 36, left: 8 }}>
            <CartesianGrid stroke="var(--bd)" strokeDasharray="2 4" />
            <XAxis
              type="number"
              dataKey="wind"
              name="Vind"
              unit=" m/s"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              stroke="var(--bd)"
              label={{ value: "Vindhastighed (m/s)", position: "bottom", offset: 16, fill: "var(--muted)", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="price"
              name="Pris"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              stroke="var(--bd)"
              width={48}
              label={{ value: "kr/kWh", angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 12 }}
            />
            <ZAxis range={[60, 60]} />
            {fit && (
              <ReferenceLine
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="6 5"
                ifOverflow="extendDomain"
                segment={[
                  { x: minX, y: fit.slope * minX + fit.intercept },
                  { x: maxX, y: fit.slope * maxX + fit.intercept },
                ]}
              />
            )}
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--muted)" }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0].payload as Row;
                return (
                  <div className="scatter-tip">
                    <span className="tip-line">{d.wind.toFixed(1)} m/s vind</span>
                    <span className="tip-line">{krKwh(d.price)} kr/kWh</span>
                    <span className="tip-line tip-sub">{Math.round(d.renew)} % vedvarende</span>
                  </div>
                );
              }}
            />
            <Scatter data={rows} fillOpacity={0.78}>
              {rows.map((row, i) => (
                <Cell key={i} fill={pointColor(row.renew)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
