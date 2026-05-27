import { test, expect } from "vitest";
import { pickInsight } from "../insight";
import type { StatPack, Finding, DatasetProfile } from "../../tool-types";

const baseProfile: DatasetProfile = {
  id: "x", source: "src", title: "Test", rowCount: 100,
  columns: [], period: null, unit: null,
};
const baseStats: StatPack = {
  hasMeasure: true, hasDimension: true, hasTime: false, rowCount: 100,
  measure: {
    column: "Befolkning", count: 5, sum: 6000000, mean: 1200000,
    median: 1244153, min: 593125, max: 1951065, spanRatio: 3.3, stdDev: 465789,
  },
  topSegments: [{ key: "Hovedstaden", value: 1951065, share: 0.32 }],
  allSegments: [], topShare: 0.32, gini: 0.22,
  segmentCount: 5, segmentSeries: [], series: [],
  yoYPct: 0.005, yoYLabel: "2026 vs 2025",
  histogram: [], outlierCount: 0,
};

test("returns top finding when findings present", () => {
  const findings = [{ overskrift: "Region X steg 9%" }] as Finding[];
  expect(pickInsight(baseStats, findings, baseProfile)).toBe("Region X steg 9%");
});

test("falls back to top-segment + yoY when no findings", () => {
  const out = pickInsight(baseStats, [], baseProfile);
  expect(out).toContain("Hovedstaden");
  expect(out).toContain("32");
  expect(out).toContain("2026 vs 2025");
});

test("falls back to yoY-only when no top-segment", () => {
  const s = { ...baseStats, topSegments: [], topShare: null };
  const out = pickInsight(s, [], baseProfile);
  expect(out).toContain("Befolkning");
  expect(out).toContain("2026 vs 2025");
});

test("falls back to structural summary when nothing else", () => {
  const s = { ...baseStats, topSegments: [], topShare: null, yoYPct: null, yoYLabel: null };
  const out = pickInsight(s, [], baseProfile);
  expect(out).toContain("100");
  expect(out).toMatch(/segmenter|kolonner/);
});
