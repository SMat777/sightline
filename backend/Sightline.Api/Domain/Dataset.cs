namespace Sightline.Api.Domain;

// Contract A — the one shape any source is normalised into. The engine reads
// cells by column Role, so it never needs to know where the data came from.
// Values in Rows are normalised at profiling time: double | DateTimeOffset | string | null.

public enum ColumnRole { Maal, Dimension, Tid }   // measure · dimension · time
public enum ColumnType { Number, Category, Date }

public record Column(
    string Name,
    ColumnRole Role,
    ColumnType Type,
    int Cardinality,      // distinct non-null values
    double NullRatio,     // share of empty cells, 0..1
    double? Min = null,   // number/date columns only
    double? Max = null);

public record Dataset(
    string Id,            // "dst:FOLK1A" | "odk:{resource_id}"
    string Source,        // "danmarks-statistik" | "open-data-dk"
    string Title,
    IReadOnlyList<Column> Columns,
    IReadOnlyList<IReadOnlyDictionary<string, object?>> Rows);
