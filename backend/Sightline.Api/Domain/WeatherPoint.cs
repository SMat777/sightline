namespace Sightline.Api.Domain;

// Weather for a zone at one hour — used for the wind->price correlation layer.
public class WeatherPoint
{
    public int Id { get; set; }
    public required string ZoneId { get; set; }

    public DateTimeOffset Timestamp { get; set; }
    public double WindMs { get; set; }
    public double SolarRadiation { get; set; }
    public double TempC { get; set; }
}
