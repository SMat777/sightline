using Sightline.Api.Domain;

namespace Sightline.Api.Services;

public record Anomaly(DateTimeOffset Timestamp, double SpotPriceDkkKwh, string Reason);
public record BestWindow(DateTimeOffset Start, DateTimeOffset End, double AvgScore, string Text);

public interface IAnomalyService
{
    // Price spikes (mean + 2*sd) and negative prices, flagged calmly.
    IReadOnlyList<Anomaly> Detect(IReadOnlyList<HourObservation> day);

    // Best contiguous window (by average score) to use power. Null if too few hours.
    BestWindow? Best(IReadOnlyList<HourObservation> day, IReadOnlyList<double> scores, int windowHours = 3);
}

public class AnomalyService : IAnomalyService
{
    public IReadOnlyList<Anomaly> Detect(IReadOnlyList<HourObservation> day)
    {
        if (day.Count == 0) return [];

        var prices = day.Select(h => h.SpotPriceDkkKwh).ToList();
        var mean = prices.Average();
        var sd = Math.Sqrt(prices.Select(p => (p - mean) * (p - mean)).Average());
        var threshold = mean + 2 * sd;

        return day
            .Where(h => h.SpotPriceDkkKwh < 0 || h.SpotPriceDkkKwh > threshold)
            .Select(h => new Anomaly(h.Timestamp, h.SpotPriceDkkKwh,
                h.SpotPriceDkkKwh < 0
                    ? "Negativ pris — du får penge for at bruge strøm."
                    : "Prisspike — markant over dagens gennemsnit."))
            .ToList();
    }

    public BestWindow? Best(IReadOnlyList<HourObservation> day, IReadOnlyList<double> scores, int windowHours = 3)
    {
        if (day.Count < windowHours || scores.Count != day.Count) return null;

        var bestStart = 0;
        var bestAvg = double.MinValue;
        for (var i = 0; i + windowHours <= scores.Count; i++)
        {
            var avg = scores.Skip(i).Take(windowHours).Average();
            if (avg > bestAvg) { bestAvg = avg; bestStart = i; }
        }

        var start = day[bestStart].Timestamp;
        var end = day[bestStart + windowHours - 1].Timestamp;
        return new BestWindow(start, end, Math.Round(bestAvg, 1),
            $"Brug strøm {start:HH:mm}–{end:HH:mm} — dagens grønneste, billigste vindue.");
    }
}
