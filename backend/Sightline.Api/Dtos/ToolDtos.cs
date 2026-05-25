namespace Sightline.Api.Dtos;

// What the tool UI consumes. No domain type ever leaves the API.

public record SourceDto(string Id, string Name);

public record DatasetRefDto(string Id, string Title, string? Org);

public record ColumnDto(string Name, string Role, string Type, int Cardinality, double NullRatio);

public record DatasetProfileDto(
    string Id,
    string Source,
    string Title,
    int RowCount,
    IReadOnlyList<ColumnDto> Columns,
    string? Period);

public record InterestingnessDto(
    double Score, double Styrke, double Overraskelse, double Sikkerhed, double Daekning);

public record EvidencePointDto(string Label, double Value);

public record EvidenceDto(string Viz, IReadOnlyList<EvidencePointDto> Points, int? HighlightIndex);

public record FindingDto(
    string Type, string Overskrift, InterestingnessDto Interessanthed, EvidenceDto Bevis);
