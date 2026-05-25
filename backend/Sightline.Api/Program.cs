using Sightline.Api.Data;
using Sightline.Api.Infrastructure;
using Sightline.Api.Services;
using Sightline.Api.Services.Engine;
using Sightline.Api.Services.Sources;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "frontend";

// --- Services ---
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Connectors call public APIs (DST, Open Data DK) over a pooled HttpClient.
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IDataSource, DstConnector>();
builder.Services.AddScoped<IDataSource, OpenDataDkConnector>();

// Signal engine: each scanner is one signal type; the ranker mixes them.
builder.Services.AddScoped<ISignalScanner, TrendScanner>();
builder.Services.AddScoped<ISignalScanner, AnomalyScanner>();
builder.Services.AddScoped<ISignalScanner, SegmentScanner>();
builder.Services.AddScoped<ISignalScanner, CorrelationScanner>();
builder.Services.AddScoped<ISignalScanner, ConcentrationScanner>();
builder.Services.AddSingleton<Ranker>();
builder.Services.AddScoped<ISignalEngine, SignalEngine>();

builder.Services.AddScoped<IEnergyRepository, EnergyRepository>();
builder.Services.AddScoped<IScoreService, ScoreService>();
builder.Services.AddScoped<IAnomalyService, AnomalyService>();
builder.Services.AddScoped<IRadarService, RadarService>();

// Dev: Vite may land on any free local port, so trust loopback only.
// Prod: lock to explicit origins from config (Cors:AllowedOrigins).
builder.Services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy =>
{
    if (builder.Environment.IsDevelopment())
        // TryCreate guards against a malformed Origin header throwing.
        policy.SetIsOriginAllowed(origin =>
                  Uri.TryCreate(origin, UriKind.Absolute, out var uri) && uri.IsLoopback)
              .AllowAnyHeader()
              .AllowAnyMethod();
    else
        // Fail-closed: missing config = no cross-origin allowed (not a wildcard).
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
              .AllowAnyHeader()
              .AllowAnyMethod();
}));

var app = builder.Build();

// --- Database: migrate + seed on startup so the demo runs with one command ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    SeedData.Apply(db);
}

// --- HTTP pipeline ---
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // interactive API explorer at /scalar/v1
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors(FrontendCorsPolicy);
app.UseAuthorization();
app.MapControllers();

app.Run();
