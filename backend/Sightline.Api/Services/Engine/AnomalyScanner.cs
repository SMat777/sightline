using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

// A point in a time series that deviates sharply from its own mean (|z| > 2.5).
public sealed class AnomalyScanner : ISignalScanner
{
    public IEnumerable<Finding> Scan(Dataset ds)
    {
        foreach (var (key, pts) in Series.ByDimensionOverTime(ds))
        {
            if (pts.Count < 6) continue;
            var vals = pts.Select(p => p.V).ToList();
            var mean = vals.Average();
            var sd = Math.Sqrt(vals.Select(v => (v - mean) * (v - mean)).Average());
            if (sd == 0) continue;

            var idx = -1;
            var bestZ = 2.5;
            for (var i = 0; i < vals.Count; i++)
            {
                var z = Math.Abs((vals[i] - mean) / sd);
                if (z > bestZ) { bestZ = z; idx = i; }
            }
            if (idx < 0) continue;

            var v = vals[idx];
            var pct = (v - mean) / Math.Abs(mean) * 100;
            var dir = v > mean ? "spike" : "dyk";
            var interest = new Interestingness(0,
                Styrke: Math.Min(1, bestZ / 4),
                Overraskelse: Math.Min(1, bestZ / 3),
                Sikkerhed: Math.Min(1, vals.Count / 12.0),
                Daekning: 1.0 / vals.Count);
            var headline = $"{key}: {dir} i {pts[idx].T.Year} — {(pct >= 0 ? "+" : "")}{pct:0}% fra normalen";
            var points = pts.Select(p => new EvidencePoint(p.T.Year.ToString(), p.V)).ToList();

            yield return new Finding(FindingType.Anomali, headline, interest, new Evidence("sparkline", points, idx));
        }
    }
}
