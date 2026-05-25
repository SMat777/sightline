using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

// Sustained direction over time per dimension-value: linear slope + R².
public sealed class TrendScanner : ISignalScanner
{
    public IEnumerable<Finding> Scan(Dataset ds)
    {
        foreach (var (key, pts) in Series.ByDimensionOverTime(ds))
        {
            var n = pts.Count;
            if (n < 4) continue;

            double sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
            for (var i = 0; i < n; i++)
            {
                double x = i, y = pts[i].V;
                sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y;
            }
            var denom = n * sxx - sx * sx;
            if (denom == 0) continue;
            var slope = (n * sxy - sx * sy) / denom;
            var r2denom = (n * sxx - sx * sx) * (n * syy - sy * sy);
            var r = r2denom > 0 ? (n * sxy - sx * sy) / Math.Sqrt(r2denom) : 0;
            var r2 = r * r;

            double first = pts[0].V, last = pts[^1].V;
            if (first == 0) continue;
            var pct = (last - first) / Math.Abs(first) * 100;
            if (r2 < 0.25 && Math.Abs(pct) < 5) continue;   // skip flat noise

            var dir = slope >= 0 ? "steg" : "faldt";
            var interest = new Interestingness(0,
                Styrke: Math.Min(1, r2),
                Overraskelse: Math.Min(1, Math.Abs(pct) / 20),
                Sikkerhed: Math.Min(1, n / 12.0),
                Daekning: (double)n / ds.Rows.Count);
            var headline = $"{key} {dir} {Math.Abs(pct):0}% ({pts[0].T.Year}→{pts[^1].T.Year})";
            var points = pts.Select(p => new EvidencePoint(p.T.Year.ToString(), p.V)).ToList();

            yield return new Finding(FindingType.Trend, headline, interest, new Evidence("sparkline", points));
        }
    }
}
