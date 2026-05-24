import type { HourStatus } from "../types";

// One place for every number/label format so the UI reads consistently.

const dkk = new Intl.NumberFormat("da-DK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Price in kr/kWh, e.g. "0,55".
export const krKwh = (v: number) => dkk.format(v);

// CO2 intensity, rounded whole grams.
export const gCo2 = (v: number) => Math.round(v).toString();

// "2026-05-23T18:00:00..." -> "18:00".
export const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

// Hour-of-day (0-23) from an ISO timestamp, in UTC to match the seeded data.
export const hourOf = (iso: string) => new Date(iso).getUTCHours();

// Status drives colour AND icon AND text — never colour alone (accessibility).
interface StatusMeta {
  label: string;
  color: string;
  icon: string;
}

export const statusMeta: Record<HourStatus, StatusMeta> = {
  Healthy: { label: "Billig & grøn", color: "var(--healthy)", icon: "●" },
  Watch: { label: "Middel", color: "var(--watch)", icon: "◆" },
  Critical: { label: "Dyr / fossil", color: "var(--critical)", icon: "▲" },
};

// Map a 0-100 score to its status band (mirrors ScoreService.Status on the API).
export const scoreStatus = (score: number): HourStatus =>
  score >= 66 ? "Healthy" : score >= 40 ? "Watch" : "Critical";
