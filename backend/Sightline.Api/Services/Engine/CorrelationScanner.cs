using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

// Two measures that move together. Needs >= 2 Maal columns, so it stays silent
// on single-measure datasets (e.g. most DST tables) — an honest non-finding.
public sealed class CorrelationScanner : ISignalScanner
{
    public IEnumerable<Finding> Scan(Dataset ds)
    {
        var measures = ds.Columns.Where(c => c.Role == ColumnRole.Maal).ToList();
        if (measures.Count < 2) yield break;

        Finding? best = null;
        var bestAbs = 0.6;   // only surface genuinely strong links

        for (var a = 0; a < measures.Count; a++)
        for (var b = a + 1; b < measures.Count; b++)
        {
            var xs = new List<double>();
            var ys = new List<double>();
            foreach (var row in ds.Rows)
                if (row.GetValueOrDefault(measures[a].Name) is double x &&
                    row.GetValueOrDefault(measures[b].Name) is double y)
                {
                    xs.Add(x); ys.Add(y);
                }

            var n = xs.Count;
            if (n < 10) continue;
            var r = Pearson(xs, ys, n);
            if (double.IsNaN(r) || Math.Abs(r) <= bestAbs) continue;

            bestAbs = Math.Abs(r);
            var pts = Enumerable.Range(0, n)
                .Select(i => new EvidencePoint(xs[i].ToString("0.###"), ys[i]))
                .ToList();
            var interest = new Interestingness(0,
                Styrke: Math.Min(1, Math.Abs(r)),
                Overraskelse: Math.Min(1, Math.Abs(r)),
                Sikkerhed: Math.Min(1, n / 30.0),
                Daekning: 1.0);
            var dir = r > 0 ? "følges ad" : "går modsat";
            best = new Finding(FindingType.Korrelation,
                $"{measures[a].Name} × {measures[b].Name} {dir} (r={r:0.00})",
                interest, new Evidence("scatter", pts));
        }

        if (best is not null) yield return best;
    }

    private static double Pearson(List<double> xs, List<double> ys, int n)
    {
        double sx = xs.Sum(), sy = ys.Sum(), sxy = 0, sxx = 0, syy = 0;
        for (var i = 0; i < n; i++) { sxy += xs[i] * ys[i]; sxx += xs[i] * xs[i]; syy += ys[i] * ys[i]; }
        var denom = Math.Sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
        return denom == 0 ? double.NaN : (n * sxy - sx * sy) / denom;
    }
}
