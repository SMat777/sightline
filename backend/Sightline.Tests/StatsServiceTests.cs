using Sightline.Api.Domain;
using Sightline.Api.Services;

namespace Sightline.Tests;

public class StatsServiceTests
{
    // Several dimension-values sharing one time slice (a cross-section).
    private static Dataset CrossSection((string Dim, double Val)[] groups, int year = 2024)
    {
        var t = new DateTimeOffset(year, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var cols = new List<Column>
        {
            new("region", ColumnRole.Dimension, ColumnType.Category, groups.Length, 0),
            new("t", ColumnRole.Tid, ColumnType.Date, 1, 0),
            new("v", ColumnRole.Maal, ColumnType.Number, groups.Length, 0),
        };
        var rows = groups
            .Select(g => (IReadOnlyDictionary<string, object?>)new Dictionary<string, object?>
            {
                ["region"] = g.Dim, ["t"] = t, ["v"] = g.Val,
            })
            .ToList();
        return new Dataset("t:x", "test", "x", cols, rows);
    }

    [Fact]
    public void NoMeasure_FallsBack()
    {
        var cols = new List<Column> { new("region", ColumnRole.Dimension, ColumnType.Category, 2, 0) };
        var rows = new IReadOnlyDictionary<string, object?>[]
        {
            new Dictionary<string, object?> { ["region"] = "A" },
            new Dictionary<string, object?> { ["region"] = "B" },
        };

        var pack = new StatsService().Compute(new Dataset("t:x", "test", "x", cols, rows));

        Assert.False(pack.HasMeasure);
        Assert.Null(pack.Measure);
        Assert.True(pack.HasDimension);
        Assert.Equal(2, pack.RowCount);
    }

    [Fact]
    public void CrossSection_DescribesMeasure_AndFlags()
    {
        var pack = new StatsService().Compute(CrossSection([("A", 10), ("B", 20), ("C", 30), ("D", 40)]));
        var m = pack.Measure!;

        Assert.True(pack is { HasMeasure: true, HasDimension: true, HasTime: true });
        Assert.Equal(4, m.Count);
        Assert.Equal(100, m.Sum);
        Assert.Equal(25, m.Mean);
        Assert.Equal(25, m.Median);     // (20 + 30) / 2
        Assert.Equal(10, m.Min);
        Assert.Equal(40, m.Max);
        Assert.Equal(4, m.SpanRatio);   // 40 / 10
    }

    [Fact]
    public void TopSegments_RankedWithShare()
    {
        var pack = new StatsService().Compute(CrossSection([("A", 50), ("B", 30), ("C", 20)]));

        Assert.Equal("A", pack.TopSegments[0].Key);
        Assert.Equal(0.5, pack.TopSegments[0].Share, 3);   // 50 / 100
        Assert.Equal(3, pack.SegmentCount);
    }

    [Fact]
    public void Concentration_HighTopShareAndGini()
    {
        // One giant value among five tiny ones -> strong concentration.
        var pack = new StatsService().Compute(
            CrossSection([("A", 1000), ("B", 10), ("C", 10), ("D", 10), ("E", 10), ("F", 10)]));

        Assert.NotNull(pack.TopShare);
        Assert.True(pack.TopShare > 0.9);   // top 20% (2 of 6) holds nearly all of it
        Assert.True(pack.Gini > 0.5);
    }

    [Fact]
    public void Outlier_CountedBeyond3Sigma()
    {
        // 20 tight values + 1 large -> the large one sits ~4.5σ out.
        var groups = Enumerable.Range(0, 20)
            .Select(i => ($"N{i}", 100.0))
            .Append(("BIG", 9000.0))
            .ToArray();

        var pack = new StatsService().Compute(CrossSection(groups));

        Assert.Equal(1, pack.OutlierCount);
    }

    [Fact]
    public void YearOverYear_ComputesPercentChange()
    {
        var cols = new List<Column>
        {
            new("t", ColumnRole.Tid, ColumnType.Date, 2, 0),
            new("v", ColumnRole.Maal, ColumnType.Number, 2, 0),
        };
        var rows = new IReadOnlyDictionary<string, object?>[]
        {
            new Dictionary<string, object?> { ["t"] = new DateTimeOffset(2023, 1, 1, 0, 0, 0, TimeSpan.Zero), ["v"] = 100.0 },
            new Dictionary<string, object?> { ["t"] = new DateTimeOffset(2024, 1, 1, 0, 0, 0, TimeSpan.Zero), ["v"] = 110.0 },
        };

        var pack = new StatsService().Compute(new Dataset("t:x", "test", "x", cols, rows));

        Assert.Equal(10.0, pack.YoYPct!.Value, 1);
        Assert.Equal("2024 vs 2023", pack.YoYLabel);
    }
}
