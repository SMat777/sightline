using Sightline.Api.Domain;
using Sightline.Api.Dtos;
using Sightline.Api.Services.Engine;
using Sightline.Api.Services.Sources;
using Microsoft.AspNetCore.Mvc;

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

    public SourcesController(IEnumerable<IDataSource> sources, ISignalEngine engine)
    {
        _sources = sources.ToDictionary(s => s.Source);
        _engine = engine;
    }

    // GET /api/sources — connectable data sources.
    [HttpGet("sources")]
    public IActionResult Sources() =>
        Ok(_sources.Keys.Select(id => new SourceDto(id, Names.GetValueOrDefault(id, id))));

    // GET /api/sources/{source}/datasets?q= — discover datasets in a source.
    [HttpGet("sources/{source}/datasets")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Datasets(string source, [FromQuery] string? q, CancellationToken ct)
    {
        if (!_sources.TryGetValue(source, out var s)) return NotFound();
        var refs = await s.ListAsync(q, ct);
        return Ok(refs.Select(r => new DatasetRefDto(r.Id, r.Title, r.Org)));
    }

    // GET /api/datasets/{source}/{id} — fetch + profile one dataset.
    [HttpGet("datasets/{source}/{id}")]
    [ProducesResponseType<DatasetProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Profile(string source, string id, CancellationToken ct)
    {
        if (!_sources.TryGetValue(source, out var s)) return NotFound();
        var ds = await s.FetchAsync(id, ct);
        return Ok(ToProfileDto(ds));
    }

    // GET /api/findings/{source}/{id} — fetch, profile, scan, rank.
    [HttpGet("findings/{source}/{id}")]
    [ProducesResponseType<IReadOnlyList<FindingDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Findings(string source, string id, CancellationToken ct)
    {
        if (!_sources.TryGetValue(source, out var s)) return NotFound();
        var ds = await s.FetchAsync(id, ct);
        return Ok(_engine.Scan(ds).Select(ToFindingDto));
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

    private static DatasetProfileDto ToProfileDto(Dataset ds)
    {
        var cols = ds.Columns
            .Select(c => new ColumnDto(c.Name, c.Role.ToString(), c.Type.ToString(),
                c.Cardinality, Math.Round(c.NullRatio, 3)))
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

        return new DatasetProfileDto(ds.Id, ds.Source, ds.Title, ds.Rows.Count, cols, period);
    }
}
