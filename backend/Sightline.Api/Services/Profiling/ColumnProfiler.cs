using Sightline.Api.Domain;

namespace Sightline.Api.Services.Profiling;

// Turns normalised rows into typed columns. Two entry points:
//   Infer     — no metadata (Open Data DK): role guessed from values + name.
//   FromHints — source supplies role+type per column (Danmarks Statistik).
public static class ColumnProfiler
{
    public static IReadOnlyList<Column> Infer(
        IReadOnlyList<IReadOnlyDictionary<string, object?>> rows)
        => Build(rows, hints: null);

    public static IReadOnlyList<Column> FromHints(
        IReadOnlyList<IReadOnlyDictionary<string, object?>> rows,
        IReadOnlyDictionary<string, (ColumnRole Role, ColumnType Type)> hints)
        => Build(rows, hints);

    private static IReadOnlyList<Column> Build(
        IReadOnlyList<IReadOnlyDictionary<string, object?>> rows,
        IReadOnlyDictionary<string, (ColumnRole Role, ColumnType Type)>? hints)
    {
        if (rows.Count == 0) return [];

        var names = rows[0].Keys.Where(k => k != "_id").ToList();   // _id is CKAN noise
        var cols = new List<Column>();

        foreach (var name in names)
        {
            var values = rows.Select(r => r.GetValueOrDefault(name)).ToList();
            var nonNull = values.Where(v => v is not null).ToList();

            ColumnType type;
            ColumnRole role;
            if (hints is not null && hints.TryGetValue(name, out var hint))
            {
                type = hint.Type;
                role = hint.Role;
            }
            else
            {
                type = InferType(nonNull);
                role = InferRole(name, type);
            }

            double? min = null, max = null;
            if (type == ColumnType.Number)
            {
                var numbers = nonNull.OfType<double>().ToList();
                if (numbers.Count > 0) { min = numbers.Min(); max = numbers.Max(); }
            }

            cols.Add(new Column(
                name, role, type,
                Cardinality: nonNull.Distinct().Count(),
                NullRatio: 1.0 - (double)nonNull.Count / rows.Count,
                min, max));
        }

        return cols;
    }

    private static ColumnType InferType(IReadOnlyList<object?> values) =>
        values.Count > 0 && values.All(v => v is DateTimeOffset) ? ColumnType.Date :
        values.Count > 0 && values.All(v => v is double) ? ColumnType.Number :
        ColumnType.Category;

    private static ColumnRole InferRole(string name, ColumnType type)
    {
        if (type == ColumnType.Date) return ColumnRole.Tid;
        var idish = name is "id" or "gid" or "objectid";
        if (type == ColumnType.Number && !idish) return ColumnRole.Maal;
        return ColumnRole.Dimension;
    }
}
