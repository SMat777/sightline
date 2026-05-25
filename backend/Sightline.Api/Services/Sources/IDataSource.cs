using Sightline.Api.Domain;

namespace Sightline.Api.Services.Sources;

public record DatasetRef(string Id, string Title, string? Org);

// A live data source the tool can connect to. List discovers datasets;
// Fetch pulls one and returns it already profiled (Contract A).
public interface IDataSource
{
    string Source { get; }   // "danmarks-statistik" | "open-data-dk"
    Task<IReadOnlyList<DatasetRef>> ListAsync(string? query, CancellationToken ct);
    Task<Dataset> FetchAsync(string datasetId, CancellationToken ct);
}
