using Sightline.Api.Domain;

namespace Sightline.Api.Services;

public interface IStatsService
{
    StatPack Compute(Dataset ds);
}

// Aggregates a dataset's primary measure into the relatable numbers the tool
// surfaces. Reads by column Role exactly like the signal scanners: a measure
// grouped by a dimension at the latest time slice. Falls back gracefully when
// there is no measure to aggregate.
public sealed class StatsService : IStatsService
{
    private const int TopSegmentCount = 5;
    private const int MaxDeckSegments = 60;

    public StatPack Compute(Dataset ds)
    {
        var measure = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Maal);
        var dim = PickDimension(ds);
        var time = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Tid);

        var hasDim = dim is not null;
        var hasTime = time is not null;

        // No measure -> nothing to aggregate; the UI shows the form profile instead.
        if (measure is null)
            return new StatPack(false, hasDim, hasTime, ds.Rows.Count, null, [], 0, null, null, null, null, 0, [], [], [], []);

        var (values, segments) = Aggregate(ds, measure, dim, time);
        if (values.Count == 0)
            return new StatPack(true, hasDim, hasTime, ds.Rows.Count, null, [], 0, null, null, null, null, 0, [], [], [], []);

        var stats = Describe(measure.Name, values);

        IReadOnlyList<Segment> topSegments = [];
        IReadOnlyList<Segment> allSegments = [];
        var segmentCount = 0;
        double? topShare = null, gini = null;
        var outliers = 0;
        if (segments is { Count: > 0 })
        {
            segmentCount = segments.Count;
            var total = segments.Sum(s => s.Val);
            if (total > 0)
            {
                var ordered = segments.OrderByDescending(s => s.Val).ToList();
                topSegments = ordered.Take(TopSegmentCount)
                    .Select(s => new Segment(s.Key, s.Val, s.Val / total)).ToList();
                allSegments = ordered.Take(MaxDeckSegments)
                    .Select(s => new Segment(s.Key, s.Val, s.Val / total)).ToList();

                var topN = Math.Max(1, (int)Math.Ceiling(segmentCount * 0.2));
                topShare = ordered.Take(topN).Sum(s => s.Val) / total;
                gini = Gini(segments.Select(s => s.Val).ToList());
            }
            outliers = CountOutliers(segments.Select(s => s.Val).ToList(), stats.Mean, stats.StdDev);
        }

        var (yoyPct, yoyLabel) = hasTime ? YearOverYear(ds, measure, time!) : (null, null);
        var series = hasTime ? BuildSeries(ds, measure, time!) : [];
        var histogram = Histogram(values);
        var segmentSeries = segments is { Count: > 0 } && hasTime
            ? TopSegmentSeries(ds, measure, dim!, time!, segments)
            : [];

        return new StatPack(true, hasDim, hasTime, ds.Rows.Count,
            stats, topSegments, segmentCount, topShare, gini, yoyPct, yoyLabel, outliers,
            series, histogram, segmentSeries, allSegments);
    }

    // Distribution of the aggregated values into 6 equal-width buckets (needs >= 8 values).
    private static IReadOnlyList<Bucket> Histogram(List<double> values)
    {
        if (values.Count < 8) return [];
        var min = values.Min();
        var max = values.Max();
        if (max <= min) return [];

        const int n = 6;
        var width = (max - min) / n;
        var counts = new int[n];
        foreach (var v in values)
            counts[Math.Min(n - 1, (int)((v - min) / width))]++;
        return Enumerable.Range(0, n)
            .Select(i => new Bucket(min + i * width, min + (i + 1) * width, counts[i]))
            .ToList();
    }

    // Time series for the top-3 segments by latest value — for a multi-line trend.
    private static IReadOnlyList<NamedSeries> TopSegmentSeries(
        Dataset ds, Column measure, Column dim, Column time, List<(string Key, double Val)> segments)
    {
        var top3 = segments.OrderByDescending(s => s.Val).Take(3).Select(s => s.Key).ToHashSet();
        var annual = ds.Rows.Select(r => r.GetValueOrDefault(time.Name)).OfType<DateTimeOffset>().All(t => t.Month == 1);

        return ds.Rows
            .Where(r => r.GetValueOrDefault(measure.Name) is double
                     && r.GetValueOrDefault(time.Name) is DateTimeOffset
                     && top3.Contains(r.GetValueOrDefault(dim.Name)?.ToString() ?? ""))
            .GroupBy(r => r.GetValueOrDefault(dim.Name)!.ToString()!)
            .Select(g => new NamedSeries(g.Key,
                g.GroupBy(r => (DateTimeOffset)r.GetValueOrDefault(time.Name)!)
                 .OrderBy(t => t.Key)
                 .Select(t => new TimePoint(
                     annual ? t.Key.ToString("yyyy") : t.Key.ToString("yyyy-MM"),
                     t.Sum(r => (double)r.GetValueOrDefault(measure.Name)!)))
                 .ToList()))
            .OrderByDescending(ns => ns.Points.Count > 0 ? ns.Points[^1].Value : 0)
            .ToList();
    }

    // Measure total per time slice, ordered chronologically. Labels collapse to the
    // year when the data is annual, otherwise yyyy-MM.
    private static IReadOnlyList<TimePoint> BuildSeries(Dataset ds, Column measure, Column time)
    {
        var slices = ds.Rows
            .Where(r => r.GetValueOrDefault(measure.Name) is double
                     && r.GetValueOrDefault(time.Name) is DateTimeOffset)
            .GroupBy(r => (DateTimeOffset)r.GetValueOrDefault(time.Name)!)
            .Select(g => (At: g.Key, Sum: g.Sum(r => (double)r.GetValueOrDefault(measure.Name)!)))
            .OrderBy(p => p.At)
            .ToList();
        if (slices.Count < 2) return [];

        var annual = slices.All(p => p.At.Month == 1);
        return slices
            .Select(p => new TimePoint(annual ? p.At.ToString("yyyy") : p.At.ToString("yyyy-MM"), p.Sum))
            .ToList();
    }

    // Pick the most aggregatable dimension: skip near-unique ID-like columns, then
    // prefer the one with the fewest (but >1) distinct values — avoids segmenting on
    // a row-id column that yields meaningless one-row "segments".
    private static Column? PickDimension(Dataset ds)
    {
        var dims = ds.Columns.Where(c => c.Role == ColumnRole.Dimension).ToList();
        if (dims.Count == 0) return null;

        var rows = ds.Rows.Count;
        var usable = rows > 20
            ? dims.Where(c => c.Cardinality >= 2 && c.Cardinality < rows * 0.95).ToList()
            : dims;
        if (usable.Count == 0) usable = dims;

        return usable.OrderBy(c => c.Cardinality < 2 ? int.MaxValue : c.Cardinality).First();
    }

    // Segments = measure summed per dimension-value (at the latest time slice when
    // both exist). With no dimension the values are the raw measure cells.
    private static (List<double> Values, List<(string Key, double Val)>? Segments) Aggregate(
        Dataset ds, Column measure, Column? dim, Column? time)
    {
        IEnumerable<IReadOnlyDictionary<string, object?>> rows = ds.Rows;
        if (dim is not null && time is not null)
        {
            var latest = ds.Rows.Select(r => r.GetValueOrDefault(time.Name))
                .OfType<DateTimeOffset>().DefaultIfEmpty().Max();
            rows = ds.Rows.Where(r => r.GetValueOrDefault(time.Name) is DateTimeOffset t && t == latest);
        }

        if (dim is not null)
        {
            var segments = rows
                .Where(r => r.GetValueOrDefault(measure.Name) is double)
                .GroupBy(r => r.GetValueOrDefault(dim.Name)?.ToString() ?? "(ukendt)")
                .Select(g => (Key: g.Key, Val: g.Sum(r => (double)r.GetValueOrDefault(measure.Name)!)))
                .ToList();
            return (segments.Select(s => s.Val).ToList(), segments);
        }

        var raw = ds.Rows.Select(r => r.GetValueOrDefault(measure.Name)).OfType<double>().ToList();
        return (raw, null);
    }

    // Sum/mean/median/min/max/span/std over the aggregated values.
    private static MeasureStats Describe(string column, List<double> values)
    {
        var n = values.Count;
        var sum = values.Sum();
        var mean = sum / n;
        var sorted = values.OrderBy(v => v).ToList();
        var median = n % 2 == 1 ? sorted[n / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0;
        var min = sorted[0];
        var max = sorted[^1];
        var variance = values.Select(v => (v - mean) * (v - mean)).Sum() / n;
        double? span = min > 0 ? max / min : null;
        return new MeasureStats(column, n, sum, mean, median, min, max, span, Math.Sqrt(variance));
    }

    // Gini coefficient over non-negative segment values (sorted formula), 0..1.
    private static double Gini(List<double> values)
    {
        var xs = values.Where(v => v >= 0).OrderBy(v => v).ToList();
        var n = xs.Count;
        var total = xs.Sum();
        if (n == 0 || total <= 0) return 0;
        double cumulativeWeighted = 0;
        for (var i = 0; i < n; i++) cumulativeWeighted += (i + 1) * xs[i];
        return 2.0 * cumulativeWeighted / (n * total) - (n + 1.0) / n;
    }

    // Segments lying more than 3 standard deviations from the mean.
    private static int CountOutliers(List<double> values, double mean, double std) =>
        std <= 0 ? 0 : values.Count(v => Math.Abs(v - mean) > 3 * std);

    // Latest time slice against the slice exactly one year earlier. Slice-based
    // (not annual sums) so quarterly/monthly data with a partial latest year
    // isn't compared against a full prior year.
    private static (double? Pct, string? Label) YearOverYear(Dataset ds, Column measure, Column time)
    {
        var slices = ds.Rows
            .Where(r => r.GetValueOrDefault(measure.Name) is double
                     && r.GetValueOrDefault(time.Name) is DateTimeOffset)
            .GroupBy(r => (DateTimeOffset)r.GetValueOrDefault(time.Name)!)
            .ToDictionary(g => g.Key, g => g.Sum(r => (double)r.GetValueOrDefault(measure.Name)!));
        if (slices.Count == 0) return (null, null);

        var latest = slices.Keys.Max();
        var prior = latest.AddYears(-1);
        if (!slices.TryGetValue(prior, out var prev) || prev == 0) return (null, null);
        var pct = (slices[latest] - prev) / Math.Abs(prev) * 100;
        return (pct, $"{latest.Year} vs {prior.Year}");
    }
}
