using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

// One dimension-value that stands out from its peers at the latest time slice.
public sealed class SegmentScanner : ISignalScanner
{
    public IEnumerable<Finding> Scan(Dataset ds)
    {
        var dim = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Dimension);
        var time = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Tid);
        var measure = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Maal);
        if (dim is null || measure is null) yield break;

        IEnumerable<IReadOnlyDictionary<string, object?>> rows = ds.Rows;
        if (time is not null)
        {
            var latest = ds.Rows
                .Select(r => r.GetValueOrDefault(time.Name))
                .OfType<DateTimeOffset>()
                .DefaultIfEmpty()
                .Max();
            rows = ds.Rows.Where(r => r.GetValueOrDefault(time.Name) is DateTimeOffset t && t == latest);
        }

        var groups = rows
            .Where(r => r.GetValueOrDefault(measure.Name) is double)
            .GroupBy(r => r.GetValueOrDefault(dim.Name)?.ToString() ?? "(ukendt)")
            .Select(g => (Key: g.Key, Val: g.Sum(r => (double)r.GetValueOrDefault(measure.Name)!)))
            .ToList();
        if (groups.Count < 3) yield break;

        var mean = groups.Average(g => g.Val);
        var sd = Math.Sqrt(groups.Select(g => (g.Val - mean) * (g.Val - mean)).Average());
        if (sd == 0) yield break;

        var standout = groups.OrderByDescending(g => Math.Abs(g.Val - mean)).First();
        var effect = (standout.Val - mean) / sd;
        if (Math.Abs(effect) < 1.5) yield break;

        var others = groups.Where(g => g.Key != standout.Key).Select(g => g.Val).DefaultIfEmpty(0).Average();
        var pct = others != 0 ? (standout.Val - others) / Math.Abs(others) * 100 : 0;
        var total = groups.Sum(g => g.Val);
        var rel = standout.Val >= others ? "over" : "under";

        var interest = new Interestingness(0,
            Styrke: Math.Min(1, Math.Abs(effect) / 3),
            Overraskelse: Math.Min(1, Math.Abs(effect) / 2),
            Sikkerhed: Math.Min(1, groups.Count / 5.0),
            Daekning: total != 0 ? standout.Val / total : 0);
        var headline = $"{standout.Key} skiller sig ud — {(pct >= 0 ? "+" : "")}{pct:0}% {rel} de øvrige";
        var hi = groups.FindIndex(g => g.Key == standout.Key);
        var points = groups.Select(g => new EvidencePoint(g.Key, g.Val)).ToList();

        yield return new Finding(FindingType.Segment, headline, interest, new Evidence("bars", points, hi));
    }
}
