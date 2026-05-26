using Sightline.Api.Domain;
using Sightline.Api.Dtos;
using Sightline.Api.Services;
using Sightline.Api.Services.Engine;
using Sightline.Api.Services.Sources;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace Sightline.Api.Controllers;

[ApiController]
[Route("api")]
public class SourcesController : ControllerBase
{
    private static readonly Dictionary<string, string> Names = new()
    {
        ["danmarks-statistik"] = "Danmarks Statistik",
        ["open-data-dk"] = "Open Data DK",
    };

    private readonly IReadOnlyDictionary<string, IDataSource> _sources;
    private readonly ISignalEngine _engine;
    private readonly IStatsService _stats;
    private readonly IMemoryCache _cache;

    public SourcesController(
        IEnumerable<IDataSource> sources, ISignalEngine engine, IStatsService stats, IMemoryCache cache)
    {
        _sources = sources.ToDictionary(s => s.Source);
        _engine = engine;
        _stats = stats;
        _cache = cache;
    }

    // Profile and findings for the same dataset share one live fetch (10 min TTL).
    private async Task<Dataset> GetDatasetAsync(IDataSource s, string source, string id, CancellationToken ct)
    {
        var key = $"ds:{source}:{id}";
        if (_cache.TryGetValue(key, out Dataset? cached) && cached is not null) return cached;
        var ds = await s.FetchAsync(id, ct);
        _cache.Set(key, ds, TimeSpan.FromMinutes(10));
        return ds;
    }

    // GET /api/sources — connectable data sources.
    [HttpGet("sources")]
    public IActionResult Sources() =>
        Ok(_sources.Keys.Select(id => new SourceDto(id, Names.GetValueOrDefault(id, id))));

    // GET /api/sources/{source}/subjects — browsable topics (empty for sources without a tree).
    [HttpGet("sources/{source}/subjects")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Subjects(string source, CancellationToken ct)
    {
        if (!_sources.TryGetValue(source, out var s)) return NotFound();
        var subjects = await s.ListSubjectsAsync(ct);
        return Ok(subjects.Select(x => new SubjectDto(x.Id, x.Name)));
    }

    // GET /api/sources/{source}/datasets?q=&subject= — discover datasets by topic or search.
    [HttpGet("sources/{source}/datasets")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Datasets(string source, [FromQuery] string? q, [FromQuery] string? subject, CancellationToken ct)
    {
        if (!_sources.TryGetValue(source, out var s)) return NotFound();
        var refs = await s.ListAsync(q, subject, ct);
        return Ok(refs.Select(r => new DatasetRefDto(r.Id, r.Title, r.Org, r.Period, r.Variables)));
    }

    // GET /api/datasets/{source}/{id} — fetch + profile one dataset.
    [HttpGet("datasets/{source}/{id}")]
    [ProducesResponseType<DatasetProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Profile(string source, string id, CancellationToken ct)
    {
        if (!_sources.TryGetValue(source, out var s)) return NotFound();
        var ds = await GetDatasetAsync(s, source, id, ct);
        return Ok(ToProfileDto(ds));
    }

    // GET /api/findings/{source}/{id} — fetch, profile, scan, rank.
    [HttpGet("findings/{source}/{id}")]
    [ProducesResponseType<IReadOnlyList<FindingDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Findings(string source, string id, CancellationToken ct)
    {
        if (!_sources.TryGetValue(source, out var s)) return NotFound();
        var ds = await GetDatasetAsync(s, source, id, ct);
        return Ok(_engine.Scan(ds).Select(ToFindingDto));
    }

    // GET /api/stats/{source}/{id} — fetch, profile, aggregate the stat-pack.
    [HttpGet("stats/{source}/{id}")]
    [ProducesResponseType<StatPackDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Stats(string source, string id, CancellationToken ct)
    {
        if (!_sources.TryGetValue(source, out var s)) return NotFound();
        var ds = await GetDatasetAsync(s, source, id, ct);
        return Ok(ToStatPackDto(_stats.Compute(ds)));
    }

    private static FindingDto ToFindingDto(Finding f)
    {
        var i = f.Interessanthed;
        return new FindingDto(
            f.Type.ToString(),
            f.Overskrift,
            new InterestingnessDto(
                Math.Round(i.Score, 3), Math.Round(i.Styrke, 3), Math.Round(i.Overraskelse, 3),
                Math.Round(i.Sikkerhed, 3), Math.Round(i.Daekning, 3)),
            new EvidenceDto(
                f.Bevis.Viz,
                f.Bevis.Points.Select(p => new EvidencePointDto(p.Label, p.Value)).ToList(),
                f.Bevis.HighlightIndex));
    }

    private static StatPackDto ToStatPackDto(StatPack p)
    {
        var m = p.Measure is null ? null : new MeasureStatsDto(
            p.Measure.Column, p.Measure.Count,
            Math.Round(p.Measure.Sum, 2), Math.Round(p.Measure.Mean, 2), Math.Round(p.Measure.Median, 2),
            Math.Round(p.Measure.Min, 2), Math.Round(p.Measure.Max, 2),
            p.Measure.SpanRatio is double sr ? Math.Round(sr, 1) : null,
            Math.Round(p.Measure.StdDev, 2));

        return new StatPackDto(
            p.HasMeasure, p.HasDimension, p.HasTime, p.RowCount, m,
            p.TopSegments.Select(s => new SegmentDto(s.Key, Math.Round(s.Value, 2), Math.Round(s.Share, 4))).ToList(),
            p.SegmentCount,
            p.TopShare is double ts ? Math.Round(ts, 4) : null,
            p.Gini is double g ? Math.Round(g, 3) : null,
            p.YoYPct is double y ? Math.Round(y, 1) : null,
            p.YoYLabel, p.OutlierCount,
            p.Series.Select(t => new TimePointDto(t.Label, Math.Round(t.Value, 2))).ToList(),
            p.Histogram.Select(b => new BucketDto(Math.Round(b.From, 2), Math.Round(b.To, 2), b.Count)).ToList(),
            p.SegmentSeries.Select(ns => new NamedSeriesDto(ns.Key,
                ns.Points.Select(t => new TimePointDto(t.Label, Math.Round(t.Value, 2))).ToList())).ToList(),
            p.AllSegments.Select(s => new SegmentDto(s.Key, Math.Round(s.Value, 2), Math.Round(s.Share, 4))).ToList());
    }

    private static DatasetProfileDto ToProfileDto(Dataset ds)
    {
        var cols = ds.Columns
            .Select(c => new ColumnDto(c.Name, c.Role.ToString(), c.Type.ToString(),
                c.Cardinality, Math.Round(c.NullRatio, 3),
                c.Min is double mn ? Math.Round(mn, 2) : null,
                c.Max is double mx ? Math.Round(mx, 2) : null))
            .ToList();

        string? period = null;
        var timeCol = ds.Columns.FirstOrDefault(c => c.Role == ColumnRole.Tid);
        if (timeCol is not null)
        {
            var times = ds.Rows
                .Select(r => r.GetValueOrDefault(timeCol.Name))
                .OfType<DateTimeOffset>()
                .ToList();
            if (times.Count > 0)
                period = $"{times.Min():yyyy-MM} – {times.Max():yyyy-MM}";
        }

        return new DatasetProfileDto(ds.Id, ds.Source, ds.Title, ds.Rows.Count, cols, period, ds.Unit);
    }
}
