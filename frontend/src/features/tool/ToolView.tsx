import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSources, fetchSubjects, fetchDatasets, fetchProfile, fetchFindings, fetchStats,
} from "../../tool-api";
import type {
  Source, SubjectRef, DatasetRef, DatasetProfile, Finding, FindingType, StatPack as StatPackData,
} from "../../tool-types";
import StatPack from "./StatPack";
import InsightHeadline from "./InsightHeadline";
import TrendChart from "./TrendChart";
import MultiLineChart from "./MultiLineChart";
import Histogram from "./Histogram";
import { AreaDeck, Waffle, BulletChart } from "./SegmentViews";
import LensSelector, { type Bias } from "./LensSelector";
import { daNum, pct } from "../../lib/format";
import { useFixtures } from "../../fixtures";
import "./riso.css";

type DiscMode = "vaelg" | "soeg";

// Schema overview band — four KPI strips above the role-cards, gives a
// one-glance read of the dataset's anatomy before drilling into roles.
function SchemaOverview({ profile }: { profile: DatasetProfile }) {
  const cols = profile.columns;
  const measures = cols.filter((c) => c.role === "Maal");
  const dims = cols.filter((c) => c.role === "Dimension");
  const times = cols.filter((c) => c.role === "Tid");
  const avgNull = cols.reduce((a, c) => a + c.nullRatio, 0) / Math.max(cols.length, 1);
  const quality = avgNull < 0.01 ? "fuld" : avgNull < 0.05 ? "god" : avgNull < 0.2 ? "ok" : "lav";
  const qTone = avgNull < 0.05 ? "good" : avgNull < 0.2 ? "mid" : "warn";
  return (
    <div className="schema-strip">
      <div className="ss-kpi">
        <span className="ss-lab">Observationer</span>
        <span className="ss-v tnum">{daNum(profile.rowCount)}</span>
        <span className="ss-sub">rækker i alt</span>
      </div>
      <div className="ss-kpi">
        <span className="ss-lab">Skema-bredde</span>
        <span className="ss-v tnum">{cols.length}</span>
        <span className="ss-sub">{measures.length} mål · {dims.length} dim · {times.length} tid</span>
      </div>
      <div className="ss-kpi">
        <span className="ss-lab">Tidsspand</span>
        <span className="ss-v">{profile.period ?? "—"}</span>
        <span className="ss-sub">{times.length > 0 ? `${times[0].cardinality} skiver` : "ingen tidsakse"}</span>
      </div>
      <div className={`ss-kpi q-${qTone}`}>
        <span className="ss-lab">Datakvalitet</span>
        <span className="ss-v">{quality}</span>
        <span className="ss-sub">{pct(avgNull, 1)} manglende i snit</span>
      </div>
    </div>
  );
}

// Role-card: one of MÅL / DIMENSIONER / TID. Lists columns inside the role,
// each with its name + type + a contextual value (range for measures,
// cardinality for dimensions, period for time). Long lists collapse to the
// first 3 items with a disclosure toggle so cards stay symmetric.
function RoleCard({
  variant, label, columns, formatItem,
}: {
  variant: "maal" | "dim" | "tid";
  label: string;
  columns: DatasetProfile["columns"];
  formatItem: (c: DatasetProfile["columns"][number]) => { sub: string; mini?: number };
}) {
  const [open, setOpen] = useState(false);
  const limit = 1;
  const overflow = columns.length > limit;
  const shown = open || !overflow ? columns : columns.slice(0, limit);
  return (
    <div className="role-card">
      <div className={`role-head r-${variant}`}>
        <span className="role-lab">{label}</span>
        <span className="role-count tnum">{columns.length}</span>
      </div>
      <div className="role-list">
        {columns.length === 0 && (
          <div className="role-empty">Ingen {label.toLowerCase()} i dette datasæt.</div>
        )}
        {shown.map((c) => {
          const { sub, mini } = formatItem(c);
          return (
            <div className="role-item" key={c.name}>
              <div className="role-item-top">
                <span className="role-nm mono">{c.name}</span>
                <span className="role-ty mono">{c.type}</span>
              </div>
              <div className="role-sub">{sub}</div>
              {mini !== undefined && (
                <div className="role-bar" aria-hidden="true">
                  <span className="role-bar-fill" style={{ width: `${Math.max(2, mini * 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {overflow && (
        <button type="button" className="role-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? `Skjul ${columns.length - limit} ekstra` : `Vis alle ${columns.length} →`}
        </button>
      )}
    </div>
  );
}

function ColumnsSection({ profile }: { profile: DatasetProfile }) {
  const cols = profile.columns;
  const measures = cols.filter((c) => c.role === "Maal");
  const dims = cols.filter((c) => c.role === "Dimension");
  const times = cols.filter((c) => c.role === "Tid");
  const maxCard = Math.max(...dims.map((c) => c.cardinality), 1);
  return (
    <section className="sect" id="s-kolonner" aria-label="Kolonner">
      <div className="sect-head"><span className="no">06</span><h2>Kolonner &amp; værdier</h2>
        <span className="meta">{cols.length} kolonner · grupperet efter rolle</span>
      </div>
      <SchemaOverview profile={profile} />
      <div className="role-grid">
        <RoleCard variant="maal" label="Mål" columns={measures}
          formatItem={(c) => ({
            sub: c.min !== null && c.max !== null
              ? `Spænder fra ${daNum(c.min)} til ${daNum(c.max)} · ${daNum(c.cardinality)} unikke værdier`
              : `${daNum(c.cardinality)} unikke værdier`,
          })} />
        <RoleCard variant="dim" label="Dimensioner" columns={dims}
          formatItem={(c) => ({
            sub: `${daNum(c.cardinality)} distinkt${c.cardinality === 1 ? "" : "e"} værdi${c.cardinality === 1 ? "" : "er"}${c.nullRatio > 0 ? ` · ${pct(c.nullRatio, 1)} mangler` : ""}`,
            mini: c.cardinality / maxCard,
          })} />
        <RoleCard variant="tid" label="Tid" columns={times}
          formatItem={(c) => ({
            sub: profile.period
              ? `${daNum(c.cardinality)} tidsskiver · ${profile.period}`
              : `${daNum(c.cardinality)} tidsskiver`,
          })} />
      </div>
    </section>
  );
}

// Plain-language gist per finding type — used inside the "Hvorfor"
// expander on each fund card. Hverdagssprog, ingen statistik-jargon.
const FUND_WHY: Record<FindingType, string> = {
  Trend: "Tallene går ikke tilfældigt op og ned — der er en klar retning over tid. Det er værd at undersøge hvad der driver bevægelsen.",
  Anomali: "Én værdi stikker af fra de andre — den ligner ikke resten af mønstret. Det kan være en fejl i data, en særlig hændelse, eller et nyt mønster der opstår.",
  Korrelation: "Når den ene ting ændrer sig, gør den anden det også — de hænger sammen. Det betyder ikke nødvendigvis at den ene forårsager den anden, men der er en sammenhæng der kan forklare en del af variationen.",
  Segment: "Ét segment opfører sig markant anderledes end de andre — enten meget højere eller meget lavere. Det er ofte her interessante historier ligger.",
  Koncentration: "Få elementer ejer størstedelen af det samlede — fordelingen er skæv. Det betyder at en lille gruppe har stor indflydelse på totalen.",
};

// One finding as a boxed card — verdict + interestingness + expandable
// "why" with score breakdown. Confidence dots carry an aria-label so
// screen-readers don't get only shape.
function FundCard({ f, rank }: { f: Finding; rank: number }) {
  const i = f.interessanthed;
  const dots = Math.max(0, Math.min(4, Math.round(i.sikkerhed * 4)));
  return (
    <article className="fcard">
      <div className="fcard-top"><span className="stamp">{f.type}</span><span className="frank mono">#{rank}</span></div>
      <h3 className="fcard-head">{f.overskrift}</h3>
      <div className="scoreline mono">
        <span>styrke <b>{pct(i.styrke)}</b></span>
        <span>overrask. <b>{pct(i.overraskelse)}</b></span>
        <span className="conf" aria-label={`Sikkerhed: ${dots} af 4`}>
          <span aria-hidden="true">{"●".repeat(dots)}{"○".repeat(4 - dots)}</span>
        </span>
      </div>
      <details className="fcard-why">
        <summary>Hvorfor er det interessant?</summary>
        <p>{FUND_WHY[f.type]}</p>
        <dl className="why-scores">
          <div><dt>Styrke</dt><dd><span className="why-bar" style={{ width: `${i.styrke * 100}%` }} />{pct(i.styrke)}</dd></div>
          <div><dt>Overraskelse</dt><dd><span className="why-bar" style={{ width: `${i.overraskelse * 100}%` }} />{pct(i.overraskelse)}</dd></div>
          <div><dt>Sikkerhed</dt><dd><span className="why-bar" style={{ width: `${i.sikkerhed * 100}%` }} />{pct(i.sikkerhed)}</dd></div>
          <div><dt>Dækning</dt><dd><span className="why-bar" style={{ width: `${i.daekning * 100}%` }} />{pct(i.daekning)}</dd></div>
        </dl>
      </details>
    </article>
  );
}

export default function ToolView() {
  const [sources, setSources] = useState<Source[]>([]);
  const [source, setSource] = useState("danmarks-statistik");
  const [subjects, setSubjects] = useState<SubjectRef[]>([]);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DatasetRef[]>([]);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [stats, setStats] = useState<StatPackData | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [lensType, setLensType] = useState<FindingType | "alle">("alle");
  const [bias, setBias] = useState<Bias>("rang");
  const [discMode, setDiscMode] = useState<DiscMode>("vaelg");
  const [activeSection, setActiveSection] = useState<string>("s-nogletal");
  const [trendView, setTrendView] = useState<"samlet" | "segment" | "tabel">("samlet");
  const [segView, setSegView] = useState<"sojler" | "omrader" | "waffle" | "bullet" | "tabel">("sojler");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useRef<AbortController | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSources().then(setSources).catch(() => {});
    initSource(source);
    return () => load.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load a source's topic tree, then browse the first topic's datasets.
  async function initSource(src: string) {
    setProfile(null); setResults([]); setError(null); setQuery("");
    try {
      const subs = await fetchSubjects(src);
      setSubjects(subs);
      const subj = subs[0]?.id ?? null;
      setActiveSubject(subj);
      const refs = await fetchDatasets(src, "", subj);
      setResults(refs);
      if (refs[0]) loadProfile(src, refs[0].id);
    } catch {
      /* surfaced on next profile attempt */
    }
  }

  function switchSource(newSource: string) {
    setSource(newSource);
    setDiscMode("vaelg");
    initSource(newSource);
  }

  async function selectSubject(id: string) {
    setActiveSubject(id);
    setDiscMode("vaelg");
    try {
      const refs = await fetchDatasets(source, "", id);
      setResults(refs);
      if (refs[0]) loadProfile(source, refs[0].id);
    } catch {
      /* keep previous */
    }
  }

  async function runSearch() {
    setActiveSubject(null);
    try {
      setResults(await fetchDatasets(source, query, null));
    } catch {
      /* keep previous */
    }
  }

  async function loadProfile(src: string, id: string) {
    load.current?.abort();
    const ctrl = new AbortController();
    load.current = ctrl;
    setLoading(true);
    setError(null);
    setFindings([]);
    setStats(null);
    setLensType("alle");
    setBias("rang");
    try {
      const [p, f, st] = await Promise.all([
        fetchProfile(src, id, ctrl.signal),
        fetchFindings(src, id, ctrl.signal),
        fetchStats(src, id, ctrl.signal),
      ]);
      if (!ctrl.signal.aborted) { setProfile(p); setFindings(f); setStats(st); }
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }

  function newAnalysis() {
    setDiscMode("soeg");
    document.getElementById("kilde")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { searchRef.current?.focus(); searchRef.current?.select(); }, 60);
  }

  const typesPresent = useMemo(() => [...new Set(findings.map((f) => f.type))], [findings]);
  const displayed = useMemo(() => {
    const list = lensType === "alle" ? findings : findings.filter((f) => f.type === lensType);
    if (bias === "overraskelse")
      return [...list].sort((a, b) => b.interessanthed.overraskelse - a.interessanthed.overraskelse);
    if (bias === "sikkerhed")
      return [...list].sort((a, b) => b.interessanthed.sikkerhed - a.interessanthed.sikkerhed);
    return list;
  }, [findings, lensType, bias]);

  const sourceName = sources.find((s) => s.id === source)?.name ?? source;
  const activeId = profile?.id.split(":").slice(1).join(":") ?? null;
  const shown = results.slice(0, 3);
  const more = results.length - shown.length;
  const ready = profile && stats && !loading;

  // Section sub-nav: only the sections that actually render for this dataset.
  const navItems = ready
    ? ([
        { id: "s-nogletal", label: "Nøgletal", on: true },
        { id: "s-udvikling", label: "Udvikling", on: stats.series.length > 1 },
        { id: "s-segmenter", label: "Segmenter", on: stats.topSegments.length > 0 },
        { id: "s-fordeling", label: "Fordeling", on: stats.histogram.length > 0 },
        { id: "s-fund", label: "Fund", on: findings.length > 0 },
        { id: "s-kolonner", label: "Kolonner", on: true },
      ].filter((i) => i.on))
    : [];

  // Scroll-spy: highlight the section nearest the top of the viewport.
  useEffect(() => {
    if (!ready) return;
    const els = navItems.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => e !== null);
    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveSection(top.target.id);
      },
      { rootMargin: "-130px 0px -65% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profile?.id, findings.length]);

  return (
    <div className="wrap" id="top">
      <div className="hero">
        <div className="hero-head">
          <h1>FIND&nbsp;SIGNALET.</h1>
          <span className="live" aria-label={`Datakilde: ${sourceName}${useFixtures ? " (demo-snapshot)" : " (live)"}`}>
            <span className="dot" aria-hidden="true" /> {sourceName} · {useFixtures ? "snapshot" : "live"}
          </span>
        </div>
        <p className="sub">
          Bladr i danske offentlige datakilder efter emne — Sightline aflæser hvert datasæt
          og lægger de tal frem du kan forholde dig til.
        </p>
        <button className="btn hero-cta" type="button" onClick={newAnalysis}>
          Ny analyse
          <svg className="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
        </button>
      </div>

        {/* discovery: browse by topic (default) or search */}
        <div className="disc" id="kilde">
          <div className="disc-bar">
            <div className="seg" role="group" aria-label="Datasæt-opdagelse">
              <button type="button" aria-pressed={discMode === "vaelg"} onClick={() => setDiscMode("vaelg")}>Bladr i emner</button>
              <button type="button" aria-pressed={discMode === "soeg"} onClick={() => setDiscMode("soeg")}>Søg</button>
            </div>
            <select className="mono kilde" value={source} onChange={(e) => switchSource(e.target.value)} aria-label="Datakilde">
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {discMode === "vaelg" && subjects.length > 0 && (
            <div className="emner" role="group" aria-label="Emner">
              {subjects.map((s) => (
                <button
                  key={s.id} type="button" className="emne"
                  aria-pressed={activeSubject === s.id}
                  onClick={() => selectSubject(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {discMode === "soeg" && (
            <div className="searchbar">
              <input
                ref={searchRef} className="mono" value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Søg datasæt…" aria-label="Søg datasæt"
              />
              <button className="go" type="button" onClick={runSearch}>Søg</button>
            </div>
          )}

          {shown.length > 0 && (
            <div className="ds-grid">
              {shown.map((r) => (
                <button
                  key={r.id}
                  className={`ds-card${r.id === activeId ? " active" : ""}`}
                  aria-current={r.id === activeId ? "true" : undefined}
                  onClick={() => loadProfile(source, r.id)}
                >
                  <span className="id mono">{r.id}</span>
                  <span className="ti">{r.title}</span>
                  <span className="mt mono">
                    {[r.variables !== null ? `${r.variables} variable` : null, r.period, r.org]
                      .filter(Boolean).join(" · ")}{r.id === activeId ? " · ▸ valgt" : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
          {more > 0 && (
            <p className="ds-more mono">+ {more} flere i dette emne — brug Søg for at finde et bestemt datasæt.</p>
          )}
        </div>

        {error && <p className="tool-error" role="alert">Kunne ikke hente data: {error}. Er API'et startet?</p>}
        {loading && (
          <div className="tool-loading" role="status" aria-label="Henter og profilerer datasæt">
            <div className="skel skel-overview" />
            <div className="skel-grid">
              <div className="skel skel-cell feat" />
              <div className="skel skel-cell" />
              <div className="skel skel-cell" />
              <div className="skel skel-cell" />
              <div className="skel skel-cell" />
              <div className="skel skel-cell" />
              <div className="skel skel-cell" />
            </div>
          </div>
        )}

        {ready && (
          <>
            <div className="ds-overview">
              <div className="dso-main">
                <span className="dso-eyebrow mono">Kilde: {sourceName}</span>
                <h2 className="dso-title">{profile.title}</h2>
              </div>
              <div className="dso-facts mono">
                <span><b className="tnum">{daNum(profile.rowCount)}</b> rækker</span>
                {profile.period && <span>periode <b>{profile.period}</b></span>}
                {profile.unit && <span>enhed <b>{profile.unit}</b></span>}
                <span><b className="tnum">{profile.columns.length}</b> kolonner</span>
              </div>
            </div>

            <nav className="subnav" aria-label="Sektioner">
              {navItems.map((i) => (
                <a key={i.id} href={`#${i.id}`} className={activeSection === i.id ? "active" : ""}>{i.label}</a>
              ))}
            </nav>

            <section className="sect" id="s-nogletal" aria-label="Nøgletal">
              <div className="sect-head"><span className="no">01</span><h2>Nøgletal</h2>
                <span className="meta">{stats.measure ? stats.measure.column : profile.title}{profile.unit ? ` · ${profile.unit}` : ""}</span>
              </div>
              <InsightHeadline stats={stats} findings={findings} profile={profile} />
              <StatPack stats={stats} profile={profile} />
            </section>

            {stats.series.length > 1 && (
              <section className="sect" id="s-udvikling" aria-label="Udvikling over tid">
                <div className="sect-head"><span className="no">02</span><h2>Udvikling over tid</h2>
                  <span className="meta">{stats.series[0].label}–{stats.series[stats.series.length - 1].label}</span>
                  <div className="seg seg-inline" role="group" aria-label="Visning">
                    <button type="button" aria-pressed={trendView === "samlet"} onClick={() => setTrendView("samlet")}>Samlet</button>
                    {stats.segmentSeries.length > 0 && (
                      <button type="button" aria-pressed={trendView === "segment"} onClick={() => setTrendView("segment")}>Pr. segment</button>
                    )}
                    <button type="button" aria-pressed={trendView === "tabel"} onClick={() => setTrendView("tabel")}>Tabel</button>
                  </div>
                </div>
                {trendView === "samlet" && <TrendChart series={stats.series} label={stats.measure?.column ?? "Mål"} />}
                {trendView === "segment" && stats.segmentSeries.length > 0 && <MultiLineChart series={stats.segmentSeries} />}
                {trendView === "tabel" && (
                  <div className="tablecard">
                    <table>
                      <caption>{stats.measure?.column ?? "Mål"} pr. tidsskive</caption>
                      <thead><tr><th scope="col">Tid</th><th scope="col" className="num">Værdi</th></tr></thead>
                      <tbody>
                        {stats.series.map((p) => (
                          <tr key={p.label}><td className="mono">{p.label}</td><td className="num tnum">{daNum(p.value)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {stats.topSegments.length > 0 && (
              <section className="sect" id="s-segmenter" aria-label="Segmenter">
                <div className="sect-head"><span className="no">03</span><h2>Segmenter</h2>
                  <span className="meta">top {stats.topSegments.length} af {daNum(stats.segmentCount)}</span>
                </div>
                <div className="seg seg-sm" role="group" aria-label="Visning">
                  <button type="button" aria-pressed={segView === "sojler"} onClick={() => setSegView("sojler")}>Søjler</button>
                  <button type="button" aria-pressed={segView === "omrader"} onClick={() => setSegView("omrader")}>Områder</button>
                  <button type="button" aria-pressed={segView === "waffle"} onClick={() => setSegView("waffle")}>Andele</button>
                  <button type="button" aria-pressed={segView === "bullet"} onClick={() => setSegView("bullet")}>Mod snit</button>
                  <button type="button" aria-pressed={segView === "tabel"} onClick={() => setSegView("tabel")}>Tabel</button>
                </div>
                {segView === "sojler" && (
                  <div className="bars">
                    {stats.topSegments.map((s, i) => (
                      <div className="bar-row" key={s.key}>
                        <span className="bar-name" title={s.key}>{s.key}</span>
                        <span className="bar-track">
                          <span className={`bar-fill r${Math.min(i + 1, 4)}`}
                            style={{ width: `${Math.max(4, (s.value / stats.topSegments[0].value) * 100)}%` }} />
                        </span>
                        <span className="bar-val tnum">{daNum(s.value)} · {pct(s.share)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {segView === "omrader" && <AreaDeck segments={stats.allSegments} />}
                {segView === "waffle" && <Waffle segments={stats.allSegments} />}
                {segView === "bullet" && stats.measure && <BulletChart segments={stats.allSegments} mean={stats.measure.mean} label={stats.measure.column} />}
                {segView === "tabel" && (
                  <div className="tablecard">
                    <table>
                      <caption>{stats.measure?.column ?? "Mål"} pr. segment, rangeret</caption>
                      <thead><tr><th className="num">#</th><th scope="col">Segment</th><th scope="col" className="num">Værdi</th><th scope="col" className="num">Andel</th></tr></thead>
                      <tbody>
                        {stats.topSegments.map((s, i) => (
                          <tr key={s.key}>
                            <td className="num rank">{i + 1}</td><td>{s.key}</td>
                            <td className="num tnum">{daNum(s.value)}</td><td className="num tnum">{pct(s.share, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {stats.topShare !== null && (
                  <p className="panel-note mono">
                    Top 20% af segmenterne rummer {pct(stats.topShare)} af totalen
                    {stats.gini !== null ? ` · Gini ${daNum(stats.gini, 2)}` : ""}.
                  </p>
                )}
              </section>
            )}

            {stats.histogram.length > 0 && (
              <section className="sect" id="s-fordeling" aria-label="Fordeling">
                <div className="sect-head"><span className="no">04</span><h2>Fordeling</h2>
                  <span className="meta">{stats.measure?.column ?? "Mål"} · {daNum(stats.segmentCount)} segmenter</span>
                </div>
                <Histogram buckets={stats.histogram} />
                <p className="panel-note mono">Hvert interval tæller hvor mange segmenter der falder i det — afslører skævhed og outliers.</p>
              </section>
            )}

            {findings.length > 0 && (
              <section className="sect" id="s-fund" aria-label="Fund">
                <div className="sect-head"><span className="no">05</span><h2>Fund</h2>
                  <span className="meta">{findings.length} signaler · rangeret</span>
                </div>
                <LensSelector types={typesPresent} activeType={lensType} onType={setLensType} bias={bias} onBias={setBias} />
                <div className="fund-grid">
                  {displayed.map((f, idx) => <FundCard key={`${f.type}-${idx}`} f={f} rank={idx + 1} />)}
                </div>
              </section>
            )}

            <ColumnsSection profile={profile} />
          </>
        )}

        <footer>
          <span className="tag">Bladr efter emne · tal i forgrunden · cards, ikke grafer.</span>
          <span className="tag">Sightline · DNA № 03 · konfigurerbart værktøj</span>
        </footer>
    </div>
  );
}
