using Sightline.Api.Domain;

namespace Sightline.Api.Data;

// Seeds one day (today, UTC) of hourly data for DK1 and DK2 so the demo tells a
// story: cheap+green nights, an expensive evening peak, and one price spike.
// TEMPORARY for Fase 1A — replaced by live ingestion in Fase 1B.
public static class SeedData
{
    public static void Apply(AppDbContext db)
    {
        if (db.Zones.Any()) return;

        db.Zones.AddRange(
            new PriceZone { Id = "DK1", Name = "Vestdanmark" },
            new PriceZone { Id = "DK2", Name = "Østdanmark" });
        db.SaveChanges();

        var day = DateOnly.FromDateTime(DateTime.UtcNow);
        AddZoneDay(db, "DK1", day, spikeHour: 18);
        AddZoneDay(db, "DK2", day, spikeHour: 19);
        db.SaveChanges();
    }

    private static void AddZoneDay(AppDbContext db, string zoneId, DateOnly day, int spikeHour)
    {
        for (var hour = 0; hour < 24; hour++)
        {
            var ts = new DateTimeOffset(day.ToDateTime(new TimeOnly(hour, 0)), TimeSpan.Zero);

            // Cheap & green at night, dearer in the evening peak; one spike.
            var peak = hour is >= 17 and <= 20;
            var night = hour is <= 5;
            var price = night ? 0.30 + hour * 0.01 : peak ? 1.10 : 0.55 + (hour % 4) * 0.04;
            if (hour == spikeHour) price = 3.20;            // anomaly: evening spike

            var wind = night ? 0.62 : peak ? 0.22 : 0.45;   // more wind at night
            var solar = hour is >= 10 and <= 15 ? 0.28 : 0.04;
            var fossil = Math.Max(0, 1 - wind - solar);
            var co2 = Math.Round(40 + fossil * 320, 0);     // dirtier when fossil-heavy

            db.Hours.Add(new HourObservation
            {
                ZoneId = zoneId,
                Timestamp = ts,
                SpotPriceDkkKwh = Math.Round(price, 2),
                Co2IntensityGKwh = co2,
                WindShare = wind,
                SolarShare = solar,
                FossilShare = Math.Round(fossil, 2)
            });

            db.Weather.Add(new WeatherPoint
            {
                ZoneId = zoneId,
                Timestamp = ts,
                WindMs = Math.Round(wind * 18, 1),          // wind share tracks wind speed
                SolarRadiation = solar * 800,
                TempC = 8 + (hour >= 12 ? 4 : 0)
            });
        }
    }
}
