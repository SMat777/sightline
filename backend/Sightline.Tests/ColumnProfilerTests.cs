using Sightline.Api.Domain;
using Sightline.Api.Services.Profiling;

namespace Sightline.Tests;

public class ColumnProfilerTests
{
    private static Dictionary<string, object?> R(object? t, object? g, object? v)
        => new() { ["kle"] = t, ["navn"] = g, ["antal"] = v };

    [Fact]
    public void Infer_RolesFromValues()
    {
        var rows = new IReadOnlyDictionary<string, object?>[]
        {
            R(new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero), "Aarhus", 120.0),
            R(new DateTimeOffset(2025, 2, 1, 0, 0, 0, TimeSpan.Zero), "Aarhus", 140.0),
            R(new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero), "Odense", 90.0),
        };

        var cols = ColumnProfiler.Infer(rows);   // no hints -> inference

        Assert.Equal(ColumnRole.Tid, cols.Single(c => c.Name == "kle").Role);
        Assert.Equal(ColumnRole.Dimension, cols.Single(c => c.Name == "navn").Role);
        Assert.Equal(ColumnRole.Maal, cols.Single(c => c.Name == "antal").Role);
        Assert.Equal(2, cols.Single(c => c.Name == "navn").Cardinality);
    }

    [Fact]
    public void Infer_DropsCkanNoiseColumn()
    {
        var rows = new IReadOnlyDictionary<string, object?>[]
        {
            new Dictionary<string, object?> { ["_id"] = 1.0, ["antal"] = 5.0 },
        };

        var cols = ColumnProfiler.Infer(rows);

        Assert.DoesNotContain(cols, c => c.Name == "_id");
    }

    [Fact]
    public void Infer_IdLikeIntegerIsDimensionNotMeasure()
    {
        var rows = new IReadOnlyDictionary<string, object?>[]
        {
            new Dictionary<string, object?> { ["gid"] = 1.0, ["antal"] = 5.0 },
            new Dictionary<string, object?> { ["gid"] = 2.0, ["antal"] = 7.0 },
        };

        var cols = ColumnProfiler.Infer(rows);

        Assert.Equal(ColumnRole.Dimension, cols.Single(c => c.Name == "gid").Role);
        Assert.Equal(ColumnRole.Maal, cols.Single(c => c.Name == "antal").Role);
    }

    [Fact]
    public void FromHints_UsesProvidedRoles()
    {
        var rows = new IReadOnlyDictionary<string, object?>[]
        {
            new Dictionary<string, object?> { ["region"] = "Fyn", ["value"] = 3.0 },
        };
        var hints = new Dictionary<string, (ColumnRole, ColumnType)>
        {
            ["region"] = (ColumnRole.Dimension, ColumnType.Category),
            ["value"] = (ColumnRole.Maal, ColumnType.Number),
        };

        var cols = ColumnProfiler.FromHints(rows, hints);

        Assert.Equal(ColumnRole.Dimension, cols.Single(c => c.Name == "region").Role);
        Assert.Equal(ColumnRole.Maal, cols.Single(c => c.Name == "value").Role);
    }
}
