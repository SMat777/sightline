# Sightline

Data exploration tool for Danish open data. 2 live sources · 9 subject trees · 5 signal scanners · stat-pack with 10 aggregate measures · ranked findings explained in one click.

**Live:** [sightline-gamma.vercel.app](https://sightline-gamma.vercel.app)
**Stack:** React 19 · TypeScript 6 · Vite 8 · Recharts · .NET 10 · ASP.NET Core · Scalar

![Sightline — FOLK1A loaded](frontend/public/screenshots/hero.png)

---

## What it does

- **Two live sources, one interface.** Danmarks Statistik (subject tree + search) and Open Data DK (CKAN). Pluggable behind one `IDataSource`.
- **Profile any dataset in one round-trip.** Columns get a role (`Mål` · `Dimension` · `Tid`) and a type. The UI adapts: time series → trend chart, dimensions → bar / waffle / area, numerics → histogram.
- **Stat-pack at a glance.** Sum, mean, median, min, max, span ratio, std-dev, Gini, year-over-year, outlier count — computed server-side in one pass.
- **Five scanners, one ranker.** Trend, anomaly, segment, correlation, concentration. Findings ranked on *strength · surprise · confidence · coverage*; re-bias by lens with no extra request.
- **Honest demo build.** `VITE_USE_FIXTURES=true` swaps the api-client to bundled snapshots so the Vercel build runs static. The header pill flips from `· live` to `· snapshot` so visitors know which mode they're in.

---

## Screen tour

**Befolkningen den 1. i kvartalet (FOLK1A).** 200 rows, 5 regions, 18-year time series. The stat-pack hero, trend chart, segment breakdown, ranked findings and column table — every dataset gets this layout.

![FOLK1A full view](frontend/public/screenshots/folk1a-full.png)

**Nyregistrerede personbiler (BIL55).** Monthly registrations 2007 → 2026. Hero numbers, trend chart, the engine's findings about the 2020 dip and the EV-share shift.

![BIL55 full view](frontend/public/screenshots/bil55-full.png)

---

## How it's built

```
React + TS (Vite)  ──▶  .NET 10 API  ──http──▶  Danmarks Statistik · Open Data DK
                          │
                          ├─ DstConnector / OpenDataDkConnector  (List, Fetch)
                          ├─ ColumnProfiler                       (role + type inference)
                          ├─ StatsService                         (stat-pack aggregation)
                          └─ SignalEngine + 5 Scanners + Ranker   (findings + interestingness)
```

The connectors return a `Dataset` (rows + typed columns). Every downstream service is pure: ColumnProfiler, StatsService, and each scanner take a `Dataset` and return a structured result. Memory cache keeps the same dataset profile across the three endpoints (profile · findings · stats) so one click = one round-trip.

| Decision | Why |
|---|---|
| `IDataSource` boundary | Adding another open-data API is one connector + DI registration. The profiler, stats and scanners don't care about the source. |
| Server-computed stat-pack | The aggregation is heavy; pushing it client-side would mean shipping every row. The API returns the summary, the UI just renders. |
| Findings = pure functions | Each scanner is `(Dataset) -> IEnumerable<Finding>`. Tested in isolation, no mocks. |
| Per-finding `Interestingness` | One ranker mixes strength, surprise, confidence, coverage. Re-ranking by lens is a client-side sort, no extra request. |
| Hybrid demo build | `VITE_USE_FIXTURES=true` swaps the api-client to bundled JSON snapshots; the Vercel build runs without a backend. |

---

## Quality

- 21 / 21 backend tests green (`dotnet test`)
- Strict TypeScript · ESLint clean
- 40 modules · ~280 kB JS / 15 kB CSS in the static demo build
- Live and demo modes share one frontend bundle, swapped by a build-time flag

---

## Run locally

### Full stack (live data from DST + Open Data DK)

Requires .NET 10 SDK and Node 20+.

```bash
# 1. Backend → http://localhost:5174  (API explorer at /scalar/v1)
dotnet run --project backend/Sightline.Api

# 2. Frontend → http://localhost:5173
cd frontend && npm install && npm run dev
```

### Demo build (no backend, snapshots only)

```bash
cd frontend && VITE_USE_FIXTURES=true npm run build && npm run preview
```

Bundled snapshots cover four datasets — FOLK1A, BIL55, ENEBR (Danmarks Statistik) and Trafiktal (Open Data DK) — captured 2026-05-26.

### Tests

```bash
dotnet test                   # backend: 21/21
cd frontend && npm run lint   # frontend: 0 errors
```

---

## API

| Endpoint | Description |
|---|---|
| `GET /api/sources` | Configured sources (DST, Open Data DK). |
| `GET /api/sources/{source}/subjects` | Browsable topics. Empty for sources without a tree (Open Data DK). |
| `GET /api/sources/{source}/datasets?q=&subject=` | Discover datasets by topic or free text. |
| `GET /api/datasets/{source}/{id}` | Fetch + profile (`DatasetProfile`). |
| `GET /api/findings/{source}/{id}` | Ranked findings from the signal engine. |
| `GET /api/stats/{source}/{id}` | Stat-pack: hero numbers, series, segments, histogram, segment-series. |

Live API explorer in dev: `http://localhost:5174/scalar/v1`.

---

## What's intentionally not here

- **No authentication.** Public open data only; no per-user state.
- **No persistence.** Every request fetches live (or, in demo mode, reads a bundled snapshot). No database.
- **No write path.** Read-only by design — Sightline interprets, it doesn't ingest.
- **No mobile-first layout.** Desktop tool; responsive but not optimized.
