import type { Source, SubjectRef, DatasetRef, DatasetProfile, Finding, StatPack } from "./tool-types";
import {
  useFixtures,
  fixtureSources, fixtureSubjects, fixtureDatasets,
  fixtureProfile, fixtureFindings, fixtureStats,
} from "./fixtures";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5174";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

// Demo mode resolves synchronously from bundled fixtures; wrap in Promise.resolve
// so callers keep their async shape and AbortController plumbing intact.
const fixture = <T,>(v: T): Promise<T> => Promise.resolve(v);

export const fetchSources = (signal?: AbortSignal): Promise<Source[]> =>
  useFixtures ? fixture(fixtureSources()) : getJson<Source[]>("/api/sources", signal);

export const fetchSubjects = (source: string, signal?: AbortSignal): Promise<SubjectRef[]> =>
  useFixtures
    ? fixture(fixtureSubjects(source))
    : getJson<SubjectRef[]>(`/api/sources/${source}/subjects`, signal);

export const fetchDatasets = (
  source: string, q: string, subject: string | null, signal?: AbortSignal,
): Promise<DatasetRef[]> => {
  if (useFixtures) return fixture(fixtureDatasets(source, q, subject));
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (subject) params.set("subject", subject);
  return getJson<DatasetRef[]>(`/api/sources/${source}/datasets?${params}`, signal);
};

export const fetchProfile = (source: string, id: string, signal?: AbortSignal): Promise<DatasetProfile> =>
  useFixtures
    ? fixture(fixtureProfile(source, id))
    : getJson<DatasetProfile>(`/api/datasets/${source}/${encodeURIComponent(id)}`, signal);

export const fetchFindings = (source: string, id: string, signal?: AbortSignal): Promise<Finding[]> =>
  useFixtures
    ? fixture(fixtureFindings(source, id))
    : getJson<Finding[]>(`/api/findings/${source}/${encodeURIComponent(id)}`, signal);

export const fetchStats = (source: string, id: string, signal?: AbortSignal): Promise<StatPack> =>
  useFixtures
    ? fixture(fixtureStats(source, id))
    : getJson<StatPack>(`/api/stats/${source}/${encodeURIComponent(id)}`, signal);
