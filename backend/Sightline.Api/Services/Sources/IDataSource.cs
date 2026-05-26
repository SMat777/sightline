using Sightline.Api.Domain;

namespace Sightline.Api.Services.Sources;

// Preview fields (Period, Variables) are best-effort from a source's free list
// metadata — left null when a source can't supply them without an extra fetch.
public record DatasetRef(string Id, string Title, string? Org, string? Period = null, int? Variables = null);

// A browsable topic/category in a source (DST subject tree). Empty for sources
// without one, in which case the UI falls back to free-text search.
public record SubjectRef(string Id, string Name);

// A live data source the tool can connect to. List discovers datasets;
// Fetch pulls one and returns it already profiled (Contract A).
public interface IDataSource
{
    string Source { get; }   // "danmarks-statistik" | "open-data-dk"
    Task<IReadOnlyList<SubjectRef>> ListSubjectsAsync(CancellationToken ct);
    Task<IReadOnlyList<DatasetRef>> ListAsync(string? query, string? subject, CancellationToken ct);
    Task<Dataset> FetchAsync(string datasetId, CancellationToken ct);
}
