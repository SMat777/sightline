using Sightline.Api.Data;
using Sightline.Api.Domain;
using Sightline.Api.Dtos;

namespace Sightline.Api.Services;

public interface IRadarService
{
    Task<RadarDayDto> GetTodayAsync(CancellationToken ct = default);
    Task<ZoneRadarDto?> GetZoneAsync(string zoneId, CancellationToken ct = default);
    Task<CorrelationDto> GetCorrelationAsync(CancellationToken ct = default);
}

// Application service: pulls observations, scores them, derives KPIs / best window /
// anomalies, and maps to DTOs. Mirrors Fase 1's SupplierService — same layered shape.
public class RadarService : IRadarService
{
    private readonly IEnergyRepository _repo;
    private readonly IScoreService _score;
    private readonly IAnomalyService _anomaly;

    public RadarService(IEnergyRepository repo, IScoreService score, IAnomalyService anomaly)
    {
        _repo = repo;
        _score = score;
        _anomaly = anomaly;
    }

    public async Task<RadarDayDto> GetTodayAsync(CancellationToken ct = default)
    {
        var date = await _repo.LatestDateAsync(ct) ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var zones = await _repo.GetZonesAsync(ct);

        var dtos = new List<ZoneRadarDto>();
        foreach (var zone in zones)
        {
            var dto = await BuildZoneAsync(zone, date, ct);
            if (dto is not null) dtos.Add(dto);
        }
        return new RadarDayDto(date.ToString("yyyy-MM-dd"), dtos);
    }

    public async Task<ZoneRadarDto?> GetZoneAsync(string zoneId, CancellationToken ct = default)
    {
        var zone = (await _repo.GetZonesAsync(ct)).FirstOrDefault(z => z.Id == zoneId);
        if (zone is null) return null;
        var date = await _repo.LatestDateAsync(ct) ?? DateOnly.FromDateTime(DateTime.UtcNow);
        return await BuildZoneAsync(zone, date, ct);
    }

    public async Task<CorrelationDto> GetCorrelationAsync(CancellationToken ct = default)
    {
        var date = await _repo.LatestDateAsync(ct) ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var zones = await _repo.GetZonesAsync(ct);

        var points = new List<CorrelationPointDto>();
        foreach (var zone in zones)
        {
            var hours = await _repo.GetDayAsync(zone.Id, date, ct);
            var weather = (await _repo.GetWeatherDayAsync(zone.Id, date, ct))
                .ToDictionary(w => w.Timestamp);

            foreach (var h in hours)
            {
                if (!weather.TryGetValue(h.Timestamp, out var w)) continue;
                points.Add(new CorrelationPointDto(
                    h.Timestamp.ToString("o"), w.WindMs, h.SpotPriceDkkKwh,
                    Math.Round((h.WindShare + h.SolarShare) * 100, 1)));
            }
        }

        var coefficient = Pearson(
            points.Select(p => p.WindMs).ToList(),
            points.Select(p => p.SpotPriceDkkKwh).ToList());
        return new CorrelationDto(Math.Round(coefficient, 2), points);
    }

    private async Task<ZoneRadarDto?> BuildZoneAsync(PriceZone zone, DateOnly date, CancellationToken ct)
    {
        var day = await _repo.GetDayAsync(zone.Id, date, ct);
        if (day.Count == 0) return null;

        var scores = day.Select(h => _score.Compute(h, day)).ToList();
        var hours = day.Select((h, i) => new HourDto(
            h.Timestamp.ToString("o"), h.SpotPriceDkkKwh, h.Co2IntensityGKwh,
            h.WindShare, h.SolarShare, h.FossilShare,
            scores[i], _score.Status(scores[i]).ToString())).ToList();

        var latest = day[^1];
        var cheapest = day.OrderBy(h => h.SpotPriceDkkKwh).First();
        var kpis = new ZoneKpiDto(
            CurrentPrice: latest.SpotPriceDkkKwh,
            CurrentCo2: latest.Co2IntensityGKwh,
            CheapestHour: cheapest.Timestamp.ToString("HH:mm"),
            CheapestPrice: cheapest.SpotPriceDkkKwh,
            RenewableSharePct: Math.Round((latest.WindShare + latest.SolarShare) * 100, 1));

        var best = _anomaly.Best(day, scores);
        var bestDto = best is null ? null : new BestWindowDto(
            best.Start.ToString("HH:mm"), best.End.ToString("HH:mm"), best.AvgScore, best.Text);

        var anomalies = _anomaly.Detect(day)
            .Select(a => new AnomalyDto(a.Timestamp.ToString("o"), a.SpotPriceDkkKwh, a.Reason))
            .ToList();

        return new ZoneRadarDto(zone.Id, zone.Name, date.ToString("yyyy-MM-dd"),
            kpis, bestDto, hours, anomalies);
    }

    // Pearson correlation coefficient; 0 when undefined (too few / no variance).
    private static double Pearson(IReadOnlyList<double> xs, IReadOnlyList<double> ys)
    {
        var n = Math.Min(xs.Count, ys.Count);
        if (n < 2) return 0;
        double mx = xs.Take(n).Average(), my = ys.Take(n).Average();
        double sxy = 0, sxx = 0, syy = 0;
        for (var i = 0; i < n; i++)
        {
            var dx = xs[i] - mx;
            var dy = ys[i] - my;
            sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
        }
        var denom = Math.Sqrt(sxx * syy);
        return denom == 0 ? 0 : sxy / denom;
    }
}
