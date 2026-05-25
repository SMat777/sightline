import { useEffect, useRef, useState } from "react";
import { fetchSources, fetchDatasets, fetchProfile } from "../../tool-api";
import type { Source, DatasetRef, DatasetProfile } from "../../tool-types";
import DataProfileStrip from "./DataProfileStrip";
import DataShape from "./DataShape";
import "./riso.css";

const roleLabel: Record<string, string> = {
  Maal: "mål",
  Dimension: "dimension",
  Tid: "tid",
};

export default function ToolView() {
  const [sources, setSources] = useState<Source[]>([]);
  const [source, setSource] = useState("danmarks-statistik");
  const [query, setQuery] = useState("befolkning");
  const [results, setResults] = useState<DatasetRef[]>([]);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useRef<AbortController | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchSources(ctrl.signal).then(setSources).catch(() => {});
    runSearch();
    loadProfile(source, "FOLK1A");
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch() {
    try {
      setResults(await fetchDatasets(source, query));
    } catch {
      /* keep previous results */
    }
  }

  async function loadProfile(src: string, id: string) {
    load.current?.abort();
    const ctrl = new AbortController();
    load.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchProfile(src, id, ctrl.signal);
      if (!ctrl.signal.aborted) setProfile(p);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Ukendt fejl");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }

  function newAnalysis() {
    document.getElementById("kilde")?.scrollIntoView({ behavior: "smooth", block: "start" });
    searchRef.current?.focus();
    searchRef.current?.select();
  }

  const sourceName = sources.find((s) => s.id === source)?.name ?? source;
  const activeId = profile?.id.split(":").slice(1).join(":") ?? null;
  const shown = results.slice(0, 8);
  const more = results.length - shown.length;

  return (
    <div className="riso">
      <nav className="nav" aria-label="Primær">
        <div className="row">
          <a className="mark" href="#top" aria-label="Sightline, til toppen">
            <svg className="glyph" viewBox="0 0 26 26" aria-hidden="true">
              <circle className="a" cx="10" cy="13" r="9" />
              <circle className="b" cx="16" cy="13" r="9" />
            </svg>
            Sightline <small>RISO·03</small>
          </a>
          <div className="menu">
            <a href="#top" aria-current="page">Dashboard</a>
            <a href="#profil">Profil</a>
            <a href="#kolonner">Kolonner</a>
          </div>
          <span className="spacer" />
          <button className="btn" type="button" onClick={newAnalysis}>
            Ny analyse
            <svg className="ar" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="wrap" id="top">
        <div className="hero">
          <h1>FIND&nbsp;SIGNALET.</h1>
          <div className="sub">
            <p>
              Forbind en dansk datakilde — Sightline profilerer den automatisk og
              finder selv det mest interessante. Print-håndværk møder
              beslutningsstøtte, skarpt og roligt.
            </p>
            <span className="live" aria-label={`Datakilde: ${sourceName}`}>
              <span className="dot" aria-hidden="true" /> {sourceName} · live
            </span>
          </div>
        </div>

        <div className="controls" id="kilde" role="group" aria-label="Vælg datakilde og datasæt">
          <span className="tag lab">Kilde</span>
          <select
            className="mono"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            aria-label="Datakilde"
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            ref={searchRef}
            className="mono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Søg datasæt…"
            aria-label="Søg datasæt"
          />
          <button className="go" type="button" onClick={runSearch}>Søg</button>
        </div>

        {shown.length > 0 && (
          <>
            <ul className="ds-list">
              {shown.map((r) => (
                <li key={r.id}>
                  <button
                    className={`ds-item${r.id === activeId ? " active" : ""}`}
                    aria-current={r.id === activeId ? "true" : undefined}
                    onClick={() => loadProfile(source, r.id)}
                  >
                    <span className="ds-id">{r.id}</span>
                    <span className="ds-title">{r.title}</span>
                    {r.id === activeId && <span className="ds-cur mono">vist ▸</span>}
                  </button>
                </li>
              ))}
            </ul>
            {more > 0 && (
              <p className="ds-more mono">+ {more} flere — forfin søgningen for at indsnævre.</p>
            )}
          </>
        )}

        {error && (
          <p className="tool-error" role="alert">
            Kunne ikke hente datasæt: {error}. Er API'et startet?
          </p>
        )}

        {loading && <p className="tool-loading">Henter &amp; profilerer…</p>}

        {profile && !loading && (
          <>
            <section id="profil" className="rise" aria-live="polite">
              <div className="sh">
                <span className="no">01</span>
                <h2>{profile.title}</h2>
                <span className="meta">{profile.id}</span>
              </div>

              <DataProfileStrip profile={profile} />

              <h3 className="block-lab">Datasættets form — distinkte værdier pr. kolonne</h3>
              <DataShape profile={profile} />
            </section>

            <section id="kolonner" className="rise">
              <div className="sh">
                <span className="no">02</span>
                <h2>Kolonner &amp; roller</h2>
                <span className="meta">udledt ved profilering</span>
              </div>
              <div className="tablecard">
                <table>
                  <caption>Hver kolonnes udledte rolle, type og antal distinkte værdier</caption>
                  <thead>
                    <tr>
                      <th scope="col">Kolonne</th>
                      <th scope="col">Rolle</th>
                      <th scope="col">Type</th>
                      <th scope="col" className="num">Distinkte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.columns.map((c) => (
                      <tr key={c.name}>
                        <td className="mono">{c.name}</td>
                        <td><span className={`pill role-${c.role.toLowerCase()}`}>{roleLabel[c.role]}</span></td>
                        <td className="mono">{c.type}</td>
                        <td className="num tnum">{c.cardinality.toLocaleString("da-DK")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer>
          <span className="tag">
            Begrænset jordnær palette + reserveret orange = afvigelsen springer frem.
          </span>
          <span className="tag">Sightline · DNA № 03 · konfigurerbart værktøj</span>
        </footer>
      </div>
    </div>
  );
}
