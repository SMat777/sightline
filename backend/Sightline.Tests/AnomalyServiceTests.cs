using Sightline.Api.Domain;
using Sightline.Api.Services;

namespace Sightline.Tests;

public class AnomalyServiceTests
{
    private readonly AnomalyService _svc = new();

    private static List<HourObservation> Day(double[] prices)
    {
        var start = new DateTimeOffset(2026, 5, 23, 0, 0, 0, TimeSpan.Zero);
        return prices.Select((p, i) => new HourObservation
        {
            ZoneId = "DK1",
            Timestamp = start.AddHours(i),
            SpotPriceDkkKwh = p,
            Co2IntensityGKwh = 100
        }).ToList();
    }

    [Fact]
    public void Detect_PriceSpike_IsFlagged()
    {
        // ten calm hours + one clear spike well above mean + 2*sd
        var prices = new[] { 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 2.00 };
        var anomalies = _svc.Detect(Day(prices));
        Assert.Single(anomalies);
        Assert.Equal(2.00, anomalies[0].SpotPriceDkkKwh);
    }

    [Fact]
    public void Detect_NegativePrice_IsFlagged()
    {
        var anomalies = _svc.Detect(Day(new[] { 0.40, 0.45, -0.10, 0.42 }));
        Assert.Contains(anomalies, a => a.SpotPriceDkkKwh < 0);
    }

    [Fact]
    public void Best_PicksHighestScoringWindow()
    {
        var day = Day(new[] { 0.9, 0.9, 0.2, 0.2, 0.2, 0.9 });
        var scores = new List<double> { 10, 20, 90, 95, 92, 30 };   // best 3h = indices 2,3,4
        var best = _svc.Best(day, scores);
        Assert.NotNull(best);
        Assert.Equal(day[2].Timestamp, best!.Start);
        Assert.Equal(day[4].Timestamp, best.End);
    }
}
