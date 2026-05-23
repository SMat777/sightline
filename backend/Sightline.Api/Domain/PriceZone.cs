namespace Sightline.Api.Domain;

// A Danish electricity price zone (DK1 = west of the Great Belt, DK2 = east).
public class PriceZone
{
    public required string Id { get; set; }    // "DK1" | "DK2"
    public required string Name { get; set; }  // human-readable, e.g. "Vestdanmark"

    public List<HourObservation> Hours { get; set; } = [];
}
