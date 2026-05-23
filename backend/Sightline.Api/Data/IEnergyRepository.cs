using Sightline.Api.Domain;

namespace Sightline.Api.Data;

public interface IEnergyRepository
{
    Task<IReadOnlyList<PriceZone>> GetZonesAsync(CancellationToken ct = default);
    Task<DateOnly?> LatestDateAsync(CancellationToken ct = default);
    Task<IReadOnlyList<HourObservation>> GetDayAsync(string zoneId, DateOnly date, CancellationToken ct = default);
    Task<IReadOnlyList<WeatherPoint>> GetWeatherDayAsync(string zoneId, DateOnly date, CancellationToken ct = default);
}
