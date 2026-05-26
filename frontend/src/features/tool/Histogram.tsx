import type { Bucket } from "../../tool-types";
import { compact, daNum } from "../../lib/format";

const W = 760;
const H = 240;
const L = 40;
const R = 14;
const T = 24;
const B = 46;

// Distribution of segment values across equal-width buckets. Highlights right-skew
// and where outliers sit (top bucket in orange when sparse).
export default function Histogram({ buckets }: { buckets: Bucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const gap = 8;
  const bw = (W - L - R - gap * (buckets.length - 1)) / buckets.length;
  const y = (c: number) => T + (1 - c / maxCount) * (H - T - B);

  return (
    <div className="chartcard">
      <svg className="linechart" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Fordeling i ${buckets.length} intervaller. Flest segmenter i det laveste interval.`}>
        {buckets.map((b, i) => {
          const xPos = L + i * (bw + gap);
          const h = (H - T - B) - (y(b.count) - T);
          const tail = b.count <= maxCount * 0.05 && i === buckets.length - 1;
          return (
            <g key={i} fontFamily="DM Mono" fontSize="10" fill="#232319">
              <rect x={xPos} y={y(b.count)} width={bw} height={Math.max(0, h)}
                fill={tail ? "#df5a1e" : i < buckets.length / 2 ? "#5c6a38" : "#93733a"} />
              <text x={xPos + bw / 2} y={y(b.count) - 6} textAnchor="middle">{daNum(b.count)}</text>
              <text x={xPos + bw / 2} y={H - B + 16} textAnchor="middle" fill="#93733a">{compact(b.from)}</text>
            </g>
          );
        })}
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="#232319" strokeWidth="2" />
        <text x={W - R} y={H - 8} textAnchor="end" fontFamily="DM Mono" fontSize="10.5" fill="#93733a">målets værdi-interval →</text>
      </svg>
    </div>
  );
}
