namespace Sightline.Api.Domain;

// Contract B — what the engine produces and the UI renders. Headlines are
// deterministic templates (not AI); minimal evidence travels with each finding
// so a Signal-kort can draw its proof without re-fetching raw data.

public enum FindingType { Anomali, Trend, Korrelation, Segment, Koncentration }

public record Interestingness(
    double Score,         // composite 0..1, set by Ranker
    double Styrke,        // effect size
    double Overraskelse,  // departure from a naive expectation
    double Sikkerhed,     // points behind it / stability
    double Daekning);     // share of data the finding covers

public record EvidencePoint(string Label, double Value);

public record Evidence(
    string Viz,           // "sparkline" | "bars" | "scatter" | "pareto"
    IReadOnlyList<EvidencePoint> Points,
    int? HighlightIndex = null);   // e.g. the anomalous point

public record Finding(
    FindingType Type,
    string Overskrift,
    Interestingness Interessanthed,
    Evidence Bevis);
