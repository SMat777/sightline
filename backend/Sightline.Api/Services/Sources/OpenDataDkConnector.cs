using System.Globalization;
using System.Text.Json;
using Sightline.Api.Domain;
using Sightline.Api.Services.Profiling;

namespace Sightline.Api.Services.Sources;

// Open Data DK — CKAN portal, no auth.
//   package_search?q=         -> datasets (+ resources)
//   datastore_search?resource_id= -> tabular rows (only datastore-active resources)
//   resource_show?id=         -> human title
// No role metadata, so we profile via Infer (roles guessed from the values).
public sealed class OpenDataDkConnector : IDataSource
{
    private const string Base = "https://admin.opendata.dk/api/3/action";
    private readonly HttpClient _http;

    public OpenDataDkConnector(IHttpClientFactory factory) => _http = factory.CreateClient();

    public string Source => "open-data-dk";

    public async Task<IReadOnlyList<DatasetRef>> ListAsync(string? query, CancellationToken ct)
    {
        var url = $"{Base}/package_search?q={Uri.EscapeDataString(query ?? "")}&rows=20";
        using var doc = JsonDocument.Parse(await _http.GetStringAsync(url, ct));

        var refs = new List<DatasetRef>();
        var results = doc.RootElement.GetProperty("result").GetProperty("results");
        foreach (var pkg in results.EnumerateArray())
        {
            var title = pkg.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "";
            string? org = pkg.TryGetProperty("organization", out var o) && o.ValueKind == JsonValueKind.Object
                && o.TryGetProperty("title", out var ot) ? ot.GetString() : null;

            if (!pkg.TryGetProperty("resources", out var resources)) continue;
            foreach (var res in resources.EnumerateArray())
            {
                if (res.TryGetProperty("datastore_active", out var da) && da.ValueKind == JsonValueKind.True)
                {
                    refs.Add(new DatasetRef(res.GetProperty("id").GetString()!, title, org));
                    break;   // one datastore resource per package is enough
                }
            }
        }
        return refs;
    }

    public async Task<Dataset> FetchAsync(string datasetId, CancellationToken ct)
    {
        var title = await ResourceNameAsync(datasetId, ct) ?? datasetId;

        var url = $"{Base}/datastore_search?resource_id={Uri.EscapeDataString(datasetId)}&limit=2000";
        using var doc = JsonDocument.Parse(await _http.GetStringAsync(url, ct));
        var result = doc.RootElement.GetProperty("result");

        var fields = new List<(string Id, string Type)>();
        foreach (var f in result.GetProperty("fields").EnumerateArray())
            fields.Add((f.GetProperty("id").GetString()!, f.GetProperty("type").GetString() ?? "text"));

        var records = new List<IReadOnlyDictionary<string, string?>>();
        foreach (var rec in result.GetProperty("records").EnumerateArray())
        {
            var row = new Dictionary<string, string?>();
            foreach (var f in fields)
                row[f.Id] = rec.TryGetProperty(f.Id, out var v)
                    ? v.ValueKind switch
                    {
                        JsonValueKind.Null => null,
                        JsonValueKind.String => v.GetString(),
                        _ => v.GetRawText(),
                    }
                    : null;
            records.Add(row);
        }

        return Map($"odk:{datasetId}", title, fields, records);
    }

    // Pure mapper — separated so it can be unit-tested without the network.
    public static Dataset Map(string id, string title,
        IReadOnlyList<(string Id, string Type)> fields,
        IReadOnlyList<IReadOnlyDictionary<string, string?>> records)
    {
        var rows = new List<IReadOnlyDictionary<string, object?>>();
        foreach (var rec in records)
        {
            var row = new Dictionary<string, object?>();
            foreach (var f in fields)
            {
                if (f.Id is "_id" or "_full_text") continue;   // CKAN bookkeeping columns
                row[f.Id] = Coerce(rec.GetValueOrDefault(f.Id), f.Type);
            }
            rows.Add(row);
        }
        return new Dataset(id, "open-data-dk", title, ColumnProfiler.Infer(rows), rows);
    }

    private async Task<string?> ResourceNameAsync(string id, CancellationToken ct)
    {
        try
        {
            using var doc = JsonDocument.Parse(
                await _http.GetStringAsync($"{Base}/resource_show?id={Uri.EscapeDataString(id)}", ct));
            var name = doc.RootElement.GetProperty("result").TryGetProperty("name", out var n) ? n.GetString() : null;
            return string.IsNullOrWhiteSpace(name) ? null : name;
        }
        catch
        {
            return null;   // title falls back to the id
        }
    }

    private static object? Coerce(string? raw, string ckanType)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var t = ckanType.ToLowerInvariant();

        if (t.Contains("timestamp") || t.Contains("date"))
            return DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var dt)
                ? dt : null;

        if (t.Contains("int") || t.Contains("num") || t.Contains("float") || t.Contains("double") || t.Contains("real"))
            return double.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : null;

        return raw;
    }
}
