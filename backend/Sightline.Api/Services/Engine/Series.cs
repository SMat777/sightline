using Sightline.Api.Domain;

namespace Sightline.Api.Services.Engine;

// Shared shaping: build per-dimension-value time series from the first
// Dimension × Tid × Maal triple. Returns empty when any role is missing,
// so scanners degrade gracefully on datasets without a time axis.
public static class Series
{
    public static IReadOnlyDictionary<string, List<(DateTimeOffset T, double V)>> ByDimensionOverTime(Dataset ds)
    {
        var result = new Dictionary<string, List<(DateTimeOffset T, double V)>>();

        var dim = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Dimension);
        var time = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Tid);
        var measure = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Maal);
        if (dim is null || time is null || measure is null) return result;

        foreach (var row in ds.Rows)
        {
            if (row.GetValueOrDefault(time.Name) is not DateTimeOffset t) continue;
            if (row.GetValueOrDefault(measure.Name) is not double v) continue;
            var key = row.GetValueOrDefault(dim.Name)?.ToString() ?? "(ukendt)";
            if (!result.TryGetValue(key, out var list)) result[key] = list = [];
            list.Add((t, v));
        }

        foreach (var list in result.Values) list.Sort((a, b) => a.T.CompareTo(b.T));
        return result;
    }
}
