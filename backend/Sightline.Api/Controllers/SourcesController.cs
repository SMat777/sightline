using Sightline.Api.Domain;
using Sightline.Api.Dtos;
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

    public SourcesController(IEnumerable<IDataSource> sources) =>
        _sources = sources.ToDictionary(s => s.Source);

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
