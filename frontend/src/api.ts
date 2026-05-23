import type { RadarDay, ZoneRadar, Correlation } from "./types";

// API base comes from the environment in production; defaults to the local .NET API.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5174";

export async function fetchRadar(): Promise<RadarDay> {
  const res = await fetch(`${API_BASE}/api/radar`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

export async function fetchZone(zone: string): Promise<ZoneRadar> {
  const res = await fetch(`${API_BASE}/api/radar/${zone}`);
  if (res.status === 404) throw new Error("Zone not found");
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

export async function fetchCorrelation(): Promise<Correlation> {
  const res = await fetch(`${API_BASE}/api/radar/correlation`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}
