using Sightline.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Sightline.Api.Data;

// Read-only access to zones, hourly observations and weather.
public class EnergyRepository : IEnergyRepository
{
    private readonly AppDbContext _db;

    public EnergyRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<PriceZone>> GetZonesAsync(CancellationToken ct = default) =>
        await _db.Zones.AsNoTracking().OrderBy(z => z.Id).ToListAsync(ct);

    public async Task<DateOnly?> LatestDateAsync(CancellationToken ct = default)
    {
        if (!await _db.Hours.AnyAsync(ct)) return null;
        var max = await _db.Hours.MaxAsync(h => h.Timestamp, ct);
        return DateOnly.FromDateTime(max.UtcDateTime);
    }

    public async Task<IReadOnlyList<HourObservation>> GetDayAsync(string zoneId, DateOnly date, CancellationToken ct = default)
    {
        var start = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var end = start.AddDays(1);
        return await _db.Hours.AsNoTracking()
            .Where(h => h.ZoneId == zoneId && h.Timestamp >= start && h.Timestamp < end)
            .OrderBy(h => h.Timestamp)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<WeatherPoint>> GetWeatherDayAsync(string zoneId, DateOnly date, CancellationToken ct = default)
    {
        var start = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var end = start.AddDays(1);
        return await _db.Weather.AsNoTracking()
            .Where(w => w.ZoneId == zoneId && w.Timestamp >= start && w.Timestamp < end)
            .OrderBy(w => w.Timestamp)
            .ToListAsync(ct);
    }
}
