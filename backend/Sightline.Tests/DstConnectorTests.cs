using Sightline.Api.Domain;
using Sightline.Api.Services.Sources;

namespace Sightline.Tests;

public class DstConnectorTests
{
    [Fact]
    public void ParseCsv_TidyRows_WithRoles()
    {
        var csv = "OMRÅDE;TID;INDHOLD\n" +
                  "Region Syddanmark;2025K1;1000\n" +
                  "Region Syddanmark;2025K2;1010\n";

        var ds = DstConnector.Parse("FOLK1A", "Befolkningen", csv,
            timeVar: "TID", dimVars: ["OMRÅDE"]);

        Assert.Equal(2, ds.Rows.Count);
        Assert.Equal(ColumnRole.Tid, ds.Columns.Single(c => c.Name == "TID").Role);
        Assert.Equal(ColumnRole.Maal, ds.Columns.Single(c => c.Name == "INDHOLD").Role);
        Assert.Equal(ColumnRole.Dimension, ds.Columns.Single(c => c.Name == "OMRÅDE").Role);
        Assert.IsType<double>(ds.Rows[0]["INDHOLD"]!);
        Assert.IsType<DateTimeOffset>(ds.Rows[0]["TID"]!);
    }

    [Fact]
    public void ParsePeriod_QuarterMapsToMonth()
    {
        var csv = "TID;INDHOLD\n2025K2;5\n";
        var ds = DstConnector.Parse("X", "x", csv, timeVar: "TID", dimVars: []);
        var t = (DateTimeOffset)ds.Rows[0]["TID"]!;
        Assert.Equal(2025, t.Year);
        Assert.Equal(4, t.Month);   // K2 -> April
    }

    [Fact]
    public void ParseNumber_MissingValue_IsNull()
    {
        var csv = "OMRÅDE;TID;INDHOLD\nFyn;2025K1;..\n";
        var ds = DstConnector.Parse("X", "x", csv, timeVar: "TID", dimVars: ["OMRÅDE"]);
        Assert.Null(ds.Rows[0]["INDHOLD"]);
    }
}
