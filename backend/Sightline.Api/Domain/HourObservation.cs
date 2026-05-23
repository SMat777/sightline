namespace Sightline.Api.Domain;

// One hour's measurement for a price zone (1..* from PriceZone).
// Price and CO2 drive the score; the mix shares (0..1) explain "why".
public class HourObservation
{
    public int Id { get; set; }
    public required string ZoneId { get; set; }
    public PriceZone? Zone { get; set; }

    public DateTimeOffset Timestamp { get; set; }   // hour granularity, chronological
    public double SpotPriceDkkKwh { get; set; }
    public double Co2IntensityGKwh { get; set; }

    public double WindShare { get; set; }    // share of production, 0..1
    public double SolarShare { get; set; }
    public double FossilShare { get; set; }
}
