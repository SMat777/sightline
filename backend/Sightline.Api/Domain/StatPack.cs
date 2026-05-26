namespace Sightline.Api.Domain;

// Stat-pack — the relatable numbers the tool surfaces per dataset. Computed over
// the primary measure, aggregated to segments at the latest time slice when a
// dimension is present (otherwise over the raw measure values). The detection
// flags let the UI switch between a rich pack and an honest fall-back profile.

public record Segment(string Key, double Value, double Share);   // Share is 0..1 of the total

public record TimePoint(string Label, double Value);             // measure total at one time slice

public record Bucket(double From, double To, int Count);         // one histogram bar (segment values)

public record NamedSeries(string Key, IReadOnlyList<TimePoint> Points);  // one segment's series over time

public record MeasureStats(
    string Column,
    int Count,            // values aggregated (segments, or rows when no dimension)
    double Sum,
    double Mean,
    double Median,
    double Min,
    double Max,
    double? SpanRatio,    // Max / Min when Min > 0 (the "×182" span); null otherwise
    double StdDev);

public record StatPack(
    bool HasMeasure,
    bool HasDimension,
    bool HasTime,
    int RowCount,
    MeasureStats? Measure,                  // null -> fall back to the form profile
    IReadOnlyList<Segment> TopSegments,     // empty without a dimension
    int SegmentCount,                       // distinct dimension values
    double? TopShare,                       // share held by the top 20% of segments, 0..1
    double? Gini,                           // 0..1 inequality across segments
    double? YoYPct,                         // % change, latest year vs previous
    string? YoYLabel,                       // e.g. "2024 vs 2023"
    int OutlierCount,                       // segments beyond 3σ from the mean
    IReadOnlyList<TimePoint> Series,        // measure total per time slice (empty without a time axis)
    IReadOnlyList<Bucket> Histogram,        // distribution of segment values (empty when too few)
    IReadOnlyList<NamedSeries> SegmentSeries, // top-3 segments over time (empty without dim+time)
    IReadOnlyList<Segment> AllSegments);    // every segment (capped), for the area deck
