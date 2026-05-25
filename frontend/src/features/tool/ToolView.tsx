import { useEffect, useRef, useState } from "react";
import { fetchSources, fetchDatasets, fetchProfile } from "../../tool-api";
import type { Source, DatasetRef, DatasetProfile } from "../../tool-types";
import DataProfileStrip from "./DataProfileStrip";
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

  useEffect(() => {
    const ctrl = new AbortController();
    fetchSources(ctrl.signal).then(setSources).catch(() => {});
    loadProfile(source, "FOLK1A");
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch() {
    try {
      setResults(await fetchDatasets(source, query));
    } catch {
      /* leave previous results */
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

  return (
    <div className="riso tool-wrap">
      <header className="tool-head">
        <p className="eyebrow mono">Sightline · konfigurerbart data-viz-værktøj</p>
        <h1>Hvad er det mest interessante i dine data?</h1>
      </header>

      <div className="tool-controls">
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
          className="mono"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Søg datasæt…"
          aria-label="Søg datasæt"
        />
        <button className="mono" onClick={runSearch}>Søg</button>
      </div>

      {results.length > 0 && (
        <ul className="ds-list">
          {results.map((r) => (
            <li key={r.id}>
              <button className="ds-item" onClick={() => loadProfile(source, r.id)}>
                <span className="mono ds-id">{r.id}</span>
                <span className="ds-title">{r.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="tool-error" role="alert">
          Kunne ikke hente datasæt: {error}. Er API'et startet?
        </p>
      )}

      {loading && <p className="mono tool-loading">Henter &amp; profilerer…</p>}

      {profile && !loading && (
        <section className="profile-panel" aria-live="polite">
          <h2>{profile.title}</h2>
          <p className="mono profile-id">{profile.id}</p>
          <DataProfileStrip profile={profile} />

          <table className="col-table">
            <caption className="sr-only">Kolonner og deres udledte roller</caption>
            <thead>
              <tr><th>Kolonne</th><th>Rolle</th><th>Type</th><th>Distinkte</th></tr>
            </thead>
            <tbody>
              {profile.columns.map((c) => (
                <tr key={c.name}>
                  <td className="mono">{c.name}</td>
                  <td><span className={`role role-${c.role.toLowerCase()}`}>{roleLabel[c.role]}</span></td>
                  <td className="mono col-type">{c.type}</td>
                  <td className="mono">{c.cardinality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
