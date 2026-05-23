using Sightline.Api.Domain;

namespace Sightline.Api.Services;

public enum HourStatus { Healthy, Watch, Critical }

public interface IScoreService
{
    // Score one hour relative to its day (percentile-based). 0-100, higher = better.
    double Compute(HourObservation hour, IReadOnlyList<HourObservation> day);
    HourStatus Status(double score);
}

// A "good hour" is cheap and green: low price + low CO2 = high score.
// Weights are tokenised so the trade-off is one constant to defend.
public class ScoreService : IScoreService
{
    private const double PriceWeight = 0.60;
    private const double Co2Weight = 0.40;

    public double Compute(HourObservation hour, IReadOnlyList<HourObservation> day)
    {
        var pricePctl = Percentile(day.Select(h => h.SpotPriceDkkKwh), hour.SpotPriceDkkKwh);
        var co2Pctl = Percentile(day.Select(h => h.Co2IntensityGKwh), hour.Co2IntensityGKwh);
        return Math.Round(100 * (PriceWeight * (1 - pricePctl) + Co2Weight * (1 - co2Pctl)), 1);
    }

    // Threshold mirrors the ribbon colours: >=66 green, >=40 amber, else red.
    public HourStatus Status(double score) =>
        score >= 66 ? HourStatus.Healthy : score >= 40 ? HourStatus.Watch : HourStatus.Critical;

    // Rank of target within values, 0..1 (0 = lowest in the set, 1 = highest).
    private static double Percentile(IEnumerable<double> values, double target)
    {
        var list = values.ToList();
        if (list.Count <= 1) return 0;
        var below = list.Count(v => v < target);
        return (double)below / (list.Count - 1);
    }
}
