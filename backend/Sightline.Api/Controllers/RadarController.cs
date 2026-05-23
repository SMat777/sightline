using Sightline.Api.Dtos;
using Sightline.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Sightline.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RadarController : ControllerBase
{
    private readonly IRadarService _radar;

    public RadarController(IRadarService radar) => _radar = radar;

    // GET /api/radar — latest day, both zones, scored.
    [HttpGet]
    [ProducesResponseType<RadarDayDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<RadarDayDto>> GetToday(CancellationToken ct) =>
        Ok(await _radar.GetTodayAsync(ct));

    // GET /api/radar/{zone} — one zone's drill-down (e.g. DK1).
    [HttpGet("{zone}")]
    [ProducesResponseType<ZoneRadarDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ZoneRadarDto>> GetZone(string zone, CancellationToken ct)
    {
        var dto = await _radar.GetZoneAsync(zone.ToUpperInvariant(), ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    // GET /api/radar/correlation — wind vs price points + coefficient.
    [HttpGet("correlation")]
    [ProducesResponseType<CorrelationDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CorrelationDto>> GetCorrelation(CancellationToken ct) =>
        Ok(await _radar.GetCorrelationAsync(ct));
}
