namespace Sightline.Api.Dtos;

// What the radar UI consumes. No entity ever leaves the API.

public record HourDto(
    string Timestamp,
    double SpotPriceDkkKwh,
    double Co2IntensityGKwh,
    double WindShare,
    double SolarShare,
    double FossilShare,
    double Score,
    string Status);

public record AnomalyDto(string Timestamp, double SpotPriceDkkKwh, string Reason);

public record BestWindowDto(string Start, string End, double AvgScore, string Text);

public record ZoneKpiDto(
    double CurrentPrice,
    double CurrentCo2,
    string CheapestHour,
    double CheapestPrice,
    double RenewableSharePct);

public record ZoneRadarDto(
    string ZoneId,
    string ZoneName,
    string Date,
    ZoneKpiDto Kpis,
    BestWindowDto? BestWindow,
    IReadOnlyList<HourDto> Hours,
    IReadOnlyList<AnomalyDto> Anomalies);

public record RadarDayDto(string Date, IReadOnlyList<ZoneRadarDto> Zones);

// Wind -> price correlation layer (the "why").
public record CorrelationPointDto(string Timestamp, double WindMs, double SpotPriceDkkKwh, double RenewableSharePct);
public record CorrelationDto(double Coefficient, IReadOnlyList<CorrelationPointDto> Points);
