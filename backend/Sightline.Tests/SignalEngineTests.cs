using Sightline.Api.Domain;
using Sightline.Api.Services.Engine;

namespace Sightline.Tests;

public class SignalEngineTests
{
    // One dimension-value, monthly time series of the given values.
    private static Dataset OneSeries(string dim, double[] values)
    {
        var start = new DateTimeOffset(2020, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var cols = new List<Column>
        {
            new("region", ColumnRole.Dimension, ColumnType.Category, 1, 0),
            new("t", ColumnRole.Tid, ColumnType.Date, values.Length, 0),
            new("v", ColumnRole.Maal, ColumnType.Number, values.Length, 0),
        };
        var rows = values
            .Select((v, i) => (IReadOnlyDictionary<string, object?>)new Dictionary<string, object?>
            {
                ["region"] = dim, ["t"] = start.AddMonths(i), ["v"] = v,
            })
            .ToList();
        return new Dataset("t:x", "test", "x", cols, rows);
    }

    // Several dimension-values sharing one time slice.
    private static Dataset CrossSection((string Dim, double Val)[] groups)
    {
        var t = new DateTimeOffset(2024, 1, 1, 0, 0, 0, TimeSpan.Zero);
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

    // Two measure columns, perfectly correlated (y = 2x + 1).
    private static Dataset TwoMeasures(int n)
    {
        var cols = new List<Column>
        {
            new("x", ColumnRole.Maal, ColumnType.Number, n, 0),
            new("y", ColumnRole.Maal, ColumnType.Number, n, 0),
        };
        var rows = Enumerable.Range(0, n)
            .Select(i => (IReadOnlyDictionary<string, object?>)new Dictionary<string, object?>
            {
                ["x"] = (double)i, ["y"] = (double)(2 * i + 1),
            })
            .ToList();
        return new Dataset("t:x", "test", "x", cols, rows);
    }

    [Fact]
    public void Trend_DetectsRise()
    {
        var f = new TrendScanner().Scan(OneSeries("Hovedstaden", [100, 110, 120, 130, 140])).Single();
        Assert.Equal(FindingType.Trend, f.Type);
        Assert.Contains("steg", f.Overskrift);
        Assert.True(f.Interessanthed.Styrke > 0.5);
    }

    [Fact]
    public void Anomaly_FlagsSpike_WithHighlight()
    {
        var f = new AnomalyScanner()
            .Scan(OneSeries("Syd", [100, 101, 99, 100, 102, 98, 250, 100, 101]))
            .Single();
        Assert.Equal(FindingType.Anomali, f.Type);
        Assert.Equal(6, f.Bevis.HighlightIndex);   // the 250 spike
    }

    [Fact]
    public void Segment_FlagsStandout()
    {
        var f = new SegmentScanner()
            .Scan(CrossSection([("A", 100), ("B", 105), ("C", 98), ("D", 500)]))
            .Single();
        Assert.Equal(FindingType.Segment, f.Type);
        Assert.Contains("D", f.Overskrift);
    }

    [Fact]
    public void Correlation_DetectsStrongPair()
    {
        var f = new CorrelationScanner().Scan(TwoMeasures(12)).Single();
        Assert.Equal(FindingType.Korrelation, f.Type);
        Assert.Contains("følges ad", f.Overskrift);
    }

    [Fact]
    public void Concentration_FlagsSkew()
    {
        var f = new ConcentrationScanner()
            .Scan(CrossSection([("A", 1000), ("B", 10), ("C", 10), ("D", 10), ("E", 10), ("F", 10)]))
            .Single();
        Assert.Equal(FindingType.Koncentration, f.Type);
    }

    [Fact]
    public void Ranker_SortsByScore_AndMixesTypes()
    {
        var strongTrend = new Finding(FindingType.Trend, "t1",
            new Interestingness(0, 0.9, 0.9, 0.9, 0.9), new Evidence("sparkline", []));
        var weakTrend = new Finding(FindingType.Trend, "t2",
            new Interestingness(0, 0.7, 0.7, 0.7, 0.7), new Evidence("sparkline", []));
        // composite 0.62 < weakTrend's 0.7, but diversity (×0.85 on the 2nd trend
        // -> 0.595) lifts this lone segment above it.
        var midSegment = new Finding(FindingType.Segment, "s1",
            new Interestingness(0, 0.62, 0.62, 0.62, 0.62), new Evidence("bars", []));

        var ranked = new Ranker().Rank([weakTrend, strongTrend, midSegment]);

        Assert.Equal("t1", ranked[0].Overskrift);          // highest composite first
        Assert.Equal(FindingType.Segment, ranked[1].Type);  // diversity lifts segment above 2nd trend
        Assert.True(ranked[0].Interessanthed.Score > 0);    // composite written back
    }
}
