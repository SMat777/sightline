namespace Sightline.Api.Dtos;

// What the tool UI consumes. No domain type ever leaves the API.

public record SourceDto(string Id, string Name);

public record SubjectDto(string Id, string Name);

public record DatasetRefDto(string Id, string Title, string? Org, string? Period, int? Variables);

public record ColumnDto(
    string Name, string Role, string Type, int Cardinality, double NullRatio,
    double? Min, double? Max);

public record DatasetProfileDto(
    string Id,
    string Source,
    string Title,
    int RowCount,
    IReadOnlyList<ColumnDto> Columns,
    string? Period,
    string? Unit);

// Stat-pack — relatable numbers per dataset (see Domain/StatPack).
public record SegmentDto(string Key, double Value, double Share);

public record TimePointDto(string Label, double Value);

public record BucketDto(double From, double To, int Count);

public record NamedSeriesDto(string Key, IReadOnlyList<TimePointDto> Points);

public record MeasureStatsDto(
    string Column, int Count, double Sum, double Mean, double Median,
    double Min, double Max, double? SpanRatio, double StdDev);

public record StatPackDto(
    bool HasMeasure,
    bool HasDimension,
    bool HasTime,
    int RowCount,
    MeasureStatsDto? Measure,
    IReadOnlyList<SegmentDto> TopSegments,
    int SegmentCount,
    double? TopShare,
    double? Gini,
    double? YoYPct,
    string? YoYLabel,
    int OutlierCount,
    IReadOnlyList<TimePointDto> Series,
    IReadOnlyList<BucketDto> Histogram,
    IReadOnlyList<NamedSeriesDto> SegmentSeries,
    IReadOnlyList<SegmentDto> AllSegments);

public record InterestingnessDto(
    double Score, double Styrke, double Overraskelse, double Sikkerhed, double Daekning);

public record EvidencePointDto(string Label, double Value);

public record EvidenceDto(string Viz, IReadOnlyList<EvidencePointDto> Points, int? HighlightIndex);

public record FindingDto(
    string Type, string Overskrift, InterestingnessDto Interessanthed, EvidenceDto Bevis);
