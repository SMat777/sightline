using Sightline.Api.Domain;
using Sightline.Api.Services;

namespace Sightline.Tests;

public class ScoreServiceTests
{
    private readonly ScoreService _svc = new();

    private static HourObservation Hour(double price, double co2) => new()
    {
        ZoneId = "DK1",
        Timestamp = DateTimeOffset.UtcNow,
        SpotPriceDkkKwh = price,
        Co2IntensityGKwh = co2
    };

    [Fact]
    public void Compute_CheapestGreenestHour_ScoresHigh()
    {
        // hour[0] is both cheapest and lowest CO2 in the day.
        var day = new List<HourObservation> { Hour(0.20, 50), Hour(0.50, 120), Hour(0.90, 240) };
        Assert.Equal(100, _svc.Compute(day[0], day));
    }

    [Fact]
    public void Compute_DearestDirtiestHour_ScoresLow()
    {
        var day = new List<HourObservation> { Hour(0.20, 50), Hour(0.50, 120), Hour(0.90, 240) };
        Assert.Equal(0, _svc.Compute(day[2], day));
    }

    [Theory]
    [InlineData(80, HourStatus.Healthy)]
    [InlineData(50, HourStatus.Watch)]
    [InlineData(20, HourStatus.Critical)]
    public void Status_MapsScoreToThreshold(double score, HourStatus expected) =>
        Assert.Equal(expected, _svc.Status(score));
}
