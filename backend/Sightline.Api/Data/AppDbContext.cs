using Sightline.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Sightline.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<PriceZone> Zones => Set<PriceZone>();
    public DbSet<HourObservation> Hours => Set<HourObservation>();
    public DbSet<WeatherPoint> Weather => Set<WeatherPoint>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<PriceZone>(entity =>
        {
            entity.Property(z => z.Id).HasMaxLength(8);
            entity.Property(z => z.Name).IsRequired().HasMaxLength(60);
            entity.HasMany(z => z.Hours)
                  .WithOne(h => h.Zone!)
                  .HasForeignKey(h => h.ZoneId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<HourObservation>(entity =>
        {
            entity.Property(h => h.ZoneId).IsRequired().HasMaxLength(8);
            entity.HasIndex(h => new { h.ZoneId, h.Timestamp });
        });

        builder.Entity<WeatherPoint>(entity =>
        {
            entity.Property(w => w.ZoneId).IsRequired().HasMaxLength(8);
            entity.HasIndex(w => new { w.ZoneId, w.Timestamp });
        });
    }
}
