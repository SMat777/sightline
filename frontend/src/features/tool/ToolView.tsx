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

const roleLabel: Record<string, string> = { Maal: "mål", Dimension: "dimension", Tid: "tid" };
type DiscMode = "vaelg" | "soeg";

// One finding as a boxed card — verdict + interestingness, no chart.
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
        <span className="conf" title="Sikkerhed">{"●".repeat(dots)}{"○".repeat(4 - dots)}</span>
      </div>
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
    <div className="riso">
      <nav className="nav" aria-label="Primær">
        <div className="row">
          <a className="mark" href="#top" aria-label="Sightline, til toppen">
            <svg className="glyph" viewBox="0 0 26 26" aria-hidden="true">
              <circle className="a" cx="10" cy="13" r="9" /><circle className="b" cx="16" cy="13" r="9" />
            </svg>
            Sightline <small>RISO·03</small>
          </a>
          <span className="spacer" />
          <span className="live" aria-label={`Datakilde: ${sourceName}${useFixtures ? " (demo-snapshot)" : " (live)"}`}>
            <span className="dot" aria-hidden="true" /> {sourceName} · {useFixtures ? "snapshot" : "live"}
          </span>
          <button className="btn" type="button" onClick={newAnalysis}>
            Ny analyse
            <svg className="ar" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </button>
        </div>
      </nav>

      <div className="wrap" id="top">
        <div className="hero">
          <h1>FIND&nbsp;SIGNALET.</h1>
          <p className="sub">
            Bladr i danske offentlige datakilder efter emne — Sightline aflæser hvert datasæt
            og lægger de tal frem du kan forholde dig til.
          </p>
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
                </div>
                <div className="seg seg-sm" role="group" aria-label="Visning">
                  <button type="button" aria-pressed={trendView === "samlet"} onClick={() => setTrendView("samlet")}>Samlet</button>
                  {stats.segmentSeries.length > 0 && (
                    <button type="button" aria-pressed={trendView === "segment"} onClick={() => setTrendView("segment")}>Pr. segment</button>
                  )}
                  <button type="button" aria-pressed={trendView === "tabel"} onClick={() => setTrendView("tabel")}>Tabel</button>
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

            <section className="sect" id="s-kolonner" aria-label="Kolonner">
              <div className="sect-head"><span className="no">06</span><h2>Kolonner &amp; værdier</h2>
                <span className="meta">min/max udledt ved profilering</span>
              </div>
              <div className="tablecard">
                <table>
                  <caption>Hver kolonnes rolle, type, værdi-interval og antal distinkte værdier</caption>
                  <thead>
                    <tr>
                      <th scope="col">Kolonne</th><th scope="col">Rolle</th><th scope="col">Type</th>
                      <th scope="col" className="num">Min</th><th scope="col" className="num">Max</th><th scope="col" className="num">Distinkte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.columns.map((c) => (
                      <tr key={c.name}>
                        <td className="mono">{c.name}</td>
                        <td><span className={`pill role-${c.role.toLowerCase()}`}>{roleLabel[c.role]}</span></td>
                        <td className="mono">{c.type}</td>
                        <td className="num tnum">{c.min !== null ? daNum(c.min) : "—"}</td>
                        <td className="num tnum">{c.max !== null ? daNum(c.max) : "—"}</td>
                        <td className="num tnum">{daNum(c.cardinality)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer>
          <span className="tag">Bladr efter emne · tal i forgrunden · cards, ikke grafer.</span>
          <span className="tag">Sightline · DNA № 03 · konfigurerbart værktøj</span>
        </footer>
      </div>
    </div>
  );
}
