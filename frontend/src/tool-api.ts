import type { Source, SubjectRef, DatasetRef, DatasetProfile, Finding, StatPack } from "./tool-types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5174";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

export const fetchSources = (signal?: AbortSignal) =>
  getJson<Source[]>("/api/sources", signal);

export const fetchSubjects = (source: string, signal?: AbortSignal) =>
  getJson<SubjectRef[]>(`/api/sources/${source}/subjects`, signal);

export const fetchDatasets = (source: string, q: string, subject: string | null, signal?: AbortSignal) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (subject) params.set("subject", subject);
  return getJson<DatasetRef[]>(`/api/sources/${source}/datasets?${params}`, signal);
};

export const fetchProfile = (source: string, id: string, signal?: AbortSignal) =>
  getJson<DatasetProfile>(
    `/api/datasets/${source}/${encodeURIComponent(id)}`, signal);

export const fetchFindings = (source: string, id: string, signal?: AbortSignal) =>
  getJson<Finding[]>(
    `/api/findings/${source}/${encodeURIComponent(id)}`, signal);

export const fetchStats = (source: string, id: string, signal?: AbortSignal) =>
  getJson<StatPack>(
    `/api/stats/${source}/${encodeURIComponent(id)}`, signal);
