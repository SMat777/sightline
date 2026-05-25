using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

// Few dimension-values carry most of the measure (80/20). Needs >= 5 groups,
// so it stays silent on small, even breakdowns.
public sealed class ConcentrationScanner : ISignalScanner
{
    public IEnumerable<Finding> Scan(Dataset ds)
    {
        var dim = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Dimension);
        var measure = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Maal);
        var time = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Tid);
        if (dim is null || measure is null) yield break;

        IEnumerable<IReadOnlyDictionary<string, object?>> rows = ds.Rows;
        if (time is not null)
        {
            var latest = ds.Rows.Select(r => r.GetValueOrDefault(time.Name))
                .OfType<DateTimeOffset>().DefaultIfEmpty().Max();
            rows = ds.Rows.Where(r => r.GetValueOrDefault(time.Name) is DateTimeOffset t && t == latest);
        }

        var groups = rows
            .Where(r => r.GetValueOrDefault(measure.Name) is double)
            .GroupBy(r => r.GetValueOrDefault(dim.Name)?.ToString() ?? "(ukendt)")
            .Select(g => (Key: g.Key, Val: g.Sum(r => (double)r.GetValueOrDefault(measure.Name)!)))
            .Where(g => g.Val > 0)
            .OrderByDescending(g => g.Val)
            .ToList();
        if (groups.Count < 5) yield break;

        var total = groups.Sum(g => g.Val);
        if (total <= 0) yield break;

        var topN = Math.Max(1, (int)Math.Ceiling(groups.Count * 0.2));
        var topShare = groups.Take(topN).Sum(g => g.Val) / total;
        if (topShare < 0.6) yield break;

        var interest = new Interestingness(0,
            Styrke: Math.Min(1, (topShare - 0.5) / 0.5),
            Overraskelse: Math.Min(1, (topShare - 0.5) / 0.4),
            Sikkerhed: Math.Min(1, groups.Count / 10.0),
            Daekning: topShare);
        var headline = $"{topShare * 100:0}% ligger hos top {topN} af {groups.Count} {dim.Name}";

        double cum = 0;
        var pts = groups.Select(g => { cum += g.Val; return new EvidencePoint(g.Key, cum / total * 100); }).ToList();

        yield return new Finding(FindingType.Koncentration, headline, interest, new Evidence("pareto", pts));
    }
}
