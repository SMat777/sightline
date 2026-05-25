using System.Globalization;
using System.Net.Http.Json;
using Sightline.Api.Domain;
using Sightline.Api.Services.Profiling;

namespace Sightline.Api.Services.Sources;

// Danmarks Statistik (StatBank) — REST/JSON, no auth.
//   tables                 -> dataset list
//   tableinfo/{id}         -> variables (dimensions, with values)
//   data/{id}/CSV?...      -> tidy-long rows
// Roles come free from tableinfo, so we profile via FromHints.
public sealed class DstConnector : IDataSource
{
    private const string Base = "https://api.statbank.dk/v1";
    private static readonly string[] TotalIds = ["TOT", "IALT", "000"];

    private readonly HttpClient _http;
    private IReadOnlyList<DstTableRef>? _tables;

    public DstConnector(IHttpClientFactory factory) => _http = factory.CreateClient();

    public string Source => "danmarks-statistik";

    public async Task<IReadOnlyList<DatasetRef>> ListAsync(string? query, CancellationToken ct)
    {
        _tables ??= await _http.GetFromJsonAsync<List<DstTableRef>>(
            $"{Base}/tables?format=JSON", ct) ?? [];

        IEnumerable<DstTableRef> hits = _tables;
        if (!string.IsNullOrWhiteSpace(query))
            hits = _tables.Where(t =>
                t.Id.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                t.Text.Contains(query, StringComparison.OrdinalIgnoreCase));

        return hits.Take(50).Select(t => new DatasetRef(t.Id, t.Text, null)).ToList();
    }

    public async Task<Dataset> FetchAsync(string datasetId, CancellationToken ct)
    {
        var info = await _http.GetFromJsonAsync<DstTableInfo>(
            $"{Base}/tableinfo/{datasetId}?format=JSON", ct)
            ?? throw new InvalidOperationException($"Unknown DST table: {datasetId}");

        var timeVar = info.Variables.First(v => v.Id.Equals("Tid", StringComparison.OrdinalIgnoreCase));
        var dims = info.Variables.Where(v => v != timeVar).ToList();
        var primary = PickPrimaryDimension(dims);

        // Bounded selection: last 40 periods, primary dimension expanded, others totalled.
        var selection = new List<(string VarId, string Values)>
        {
            (timeVar.Id, string.Join(",", timeVar.Values.TakeLast(40).Select(x => x.Id))),
        };
        foreach (var dim in dims)
        {
            var ids = dim == primary
                ? SelectPrimaryValues(dim).Select(x => x.Id)
                : [TotalValue(dim).Id];
            selection.Add((dim.Id, string.Join(",", ids)));
        }

        var query = string.Join("&", selection.Select(s =>
            $"{Uri.EscapeDataString(s.VarId)}={Uri.EscapeDataString(s.Values)}"));
        var csv = await _http.GetStringAsync($"{Base}/data/{datasetId}/CSV?{query}", ct);

        // CSV headers are the variable ids upper-cased; the measure column is INDHOLD.
        return Parse($"dst:{datasetId}", info.Text, csv,
            timeVar: timeVar.Id.ToUpperInvariant(),
            dimVars: dims.Select(d => d.Id.ToUpperInvariant()).ToList());
    }

    // Pure parser — separated so it can be unit-tested without the network.
    public static Dataset Parse(string id, string title, string csv, string timeVar,
        IReadOnlyList<string> dimVars)
    {
        var lines = csv.Replace("﻿", "")
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var header = lines[0].Split(';');
        var measureCol = header.Single(h =>
            !h.Equals(timeVar, StringComparison.OrdinalIgnoreCase) &&
            !dimVars.Contains(h, StringComparer.OrdinalIgnoreCase));

        var rows = new List<IReadOnlyDictionary<string, object?>>();
        foreach (var line in lines.Skip(1))
        {
            var cells = line.Split(';');
            var row = new Dictionary<string, object?>();
            for (var i = 0; i < header.Length; i++)
            {
                var name = header[i];
                var raw = i < cells.Length ? cells[i] : "";
                if (name.Equals(timeVar, StringComparison.OrdinalIgnoreCase))
                    row[name] = ParsePeriod(raw);
                else if (name == measureCol)
                    row[name] = ParseNumber(raw);
                else
                    row[name] = raw;
            }
            rows.Add(row);
        }

        var hints = new Dictionary<string, (ColumnRole, ColumnType)>(StringComparer.Ordinal)
        {
            [timeVar] = (ColumnRole.Tid, ColumnType.Date),
            [measureCol] = (ColumnRole.Maal, ColumnType.Number),
        };
        foreach (var d in dimVars) hints[d] = (ColumnRole.Dimension, ColumnType.Category);

        return new Dataset(id, "danmarks-statistik", title,
            ColumnProfiler.FromHints(rows, hints), rows);
    }

    private DstVariable PickPrimaryDimension(IReadOnlyList<DstVariable> dims)
    {
        // Prefer a geographic dimension (values like "Region Hovedstaden") for clean series;
        // otherwise the first dimension with at least two non-total values.
        var geo = dims.FirstOrDefault(d =>
            d.Values.Any(v => v.Text.StartsWith("Region ", StringComparison.OrdinalIgnoreCase)));
        return geo ?? dims.First(d => NonTotal(d).Count >= 2);
    }

    private IReadOnlyList<DstVarValue> SelectPrimaryValues(DstVariable dim)
    {
        var regions = dim.Values
            .Where(v => v.Text.StartsWith("Region ", StringComparison.OrdinalIgnoreCase))
            .ToList();
        return regions.Count >= 2 ? regions : NonTotal(dim).Take(12).ToList();
    }

    private List<DstVarValue> NonTotal(DstVariable dim) =>
        dim.Values.Where(v => !IsTotal(v)).ToList();

    private DstVarValue TotalValue(DstVariable dim) =>
        dim.Values.FirstOrDefault(IsTotal) ?? dim.Values[0];

    private static bool IsTotal(DstVarValue v) =>
        TotalIds.Contains(v.Id, StringComparer.OrdinalIgnoreCase) ||
        v.Text.Equals("I alt", StringComparison.OrdinalIgnoreCase);

    private static DateTimeOffset ParsePeriod(string p)
    {
        int year = int.Parse(p[..4], CultureInfo.InvariantCulture);
        int month = 1;
        var k = p.IndexOf('K');
        var m = p.IndexOf('M');
        if (k > 0) month = (int.Parse(p[(k + 1)..], CultureInfo.InvariantCulture) - 1) * 3 + 1;
        else if (m > 0) month = int.Parse(p[(m + 1)..], CultureInfo.InvariantCulture);
        return new DateTimeOffset(year, month, 1, 0, 0, 0, TimeSpan.Zero);
    }

    private static double? ParseNumber(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw) || raw == "..") return null;
        return double.TryParse(raw.Replace(',', '.'), NumberStyles.Any,
            CultureInfo.InvariantCulture, out var d) ? d : null;
    }

    private sealed record DstTableRef(string Id, string Text);
    private sealed record DstVarValue(string Id, string Text);
    private sealed record DstVariable(string Id, string Text, List<DstVarValue> Values);
    private sealed record DstTableInfo(string Id, string Text, List<DstVariable> Variables);
}
