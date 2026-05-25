using Sightline.Api.Domain;
using Sightline.Api.Services.Sources;

namespace Sightline.Tests;

public class OpenDataDkConnectorTests
{
    private static IReadOnlyDictionary<string, string?> Rec(string id, string kle, string navn, string antal)
        => new Dictionary<string, string?> { ["_id"] = id, ["kle"] = kle, ["navn"] = navn, ["antal"] = antal };

    [Fact]
    public void Map_InfersRoles_AndDropsNoise()
    {
        var fields = new (string, string)[]
        {
            ("_id", "int"), ("kle", "timestamp"), ("navn", "text"), ("antal", "numeric"),
        };
        var recs = new[]
        {
            Rec("1", "2025-01-01T00:00:00", "Aarhus", "120"),
            Rec("2", "2025-02-01T00:00:00", "Aarhus", "140"),
        };

        var ds = OpenDataDkConnector.Map("odk:abc", "Trafiktal", fields, recs);

        Assert.Equal(ColumnRole.Tid, ds.Columns.Single(c => c.Name == "kle").Role);
        Assert.Equal(ColumnRole.Maal, ds.Columns.Single(c => c.Name == "antal").Role);
        Assert.Equal(ColumnRole.Dimension, ds.Columns.Single(c => c.Name == "navn").Role);
        Assert.DoesNotContain(ds.Columns, c => c.Name == "_id");
        Assert.IsType<DateTimeOffset>(ds.Rows[0]["kle"]!);
        Assert.IsType<double>(ds.Rows[0]["antal"]!);
    }

    [Fact]
    public void Map_DropsFullTextColumn()
    {
        var fields = new (string, string)[] { ("_full_text", "tsvector"), ("antal", "numeric") };
        var recs = new IReadOnlyDictionary<string, string?>[]
        {
            new Dictionary<string, string?> { ["_full_text"] = "'aarhus'", ["antal"] = "5" },
        };

        var ds = OpenDataDkConnector.Map("odk:x", "x", fields, recs);

        Assert.DoesNotContain(ds.Columns, c => c.Name == "_full_text");
        Assert.Single(ds.Columns);
    }
}
