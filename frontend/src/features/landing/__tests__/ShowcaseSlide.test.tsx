import { test, expect } from "vitest";
import { render } from "@testing-library/react";
import ShowcaseSlide from "../ShowcaseSlide";
import type { StatPack, DatasetProfile, Finding } from "../../../tool-types";

const profile: DatasetProfile = {
  id: "dst:FOLK1A", source: "dst", title: "Befolkningen",
  rowCount: 200, columns: [], period: "2016–2026", unit: "Antal",
};
const stats: StatPack = {
  hasMeasure: true, hasDimension: true, hasTime: true, rowCount: 200,
  measure: {
    column: "Personer", count: 5, sum: 6000000, mean: 1200000,
    median: 1244153, min: 593125, max: 1951065, spanRatio: 3.3, stdDev: 465789,
  },
  topSegments: [
    { key: "Hovedstaden", value: 1951065, share: 0.32 },
    { key: "Nordjylland", value: 593125, share: 0.10 },
  ],
  allSegments: [], topShare: 0.32, gini: 0.22, segmentCount: 5,
  segmentSeries: [],
  series: [
    { label: "2016", value: 5500000 },
    { label: "2021", value: 5800000 },
    { label: "2026", value: 6000000 },
  ],
  yoYPct: 0.005, yoYLabel: "2026 vs 2025",
  histogram: [], outlierCount: 0,
};

test("renders all 6 KPI cells with insight headline", () => {
  const findings: Finding[] = [];
  const { container } = render(
    <ShowcaseSlide profile={profile} stats={stats} findings={findings}
      active={true} topic="Borgere" />,
  );
  expect(container.querySelectorAll(".sc").length).toBe(6);
  expect(container.querySelector(".slide-insight")).not.toBeNull();
  expect(container.querySelector(".topic")?.textContent).toBe("Borgere");
});

test("insight uses pickInsight fallback when findings empty", () => {
  const { container } = render(
    <ShowcaseSlide profile={profile} stats={stats} findings={[]}
      active={true} topic="x" />,
  );
  expect(container.querySelector(".slide-insight")?.textContent).toContain("Hovedstaden");
});

test("insight uses first finding when findings present", () => {
  const findings = [{ overskrift: "Custom finding" }] as Finding[];
  const { container } = render(
    <ShowcaseSlide profile={profile} stats={stats} findings={findings}
      active={true} topic="x" />,
  );
  expect(container.querySelector(".slide-insight")?.textContent).toContain("Custom finding");
});

test("hides sparkline when series too short", () => {
  const thin = { ...stats, series: [{ label: "2026", value: 1 }] };
  const { container } = render(
    <ShowcaseSlide profile={profile} stats={thin} findings={[]}
      active={true} topic="x" />,
  );
  expect(container.querySelector(".slide-spark")).toBeNull();
});

test("returns null when no measure", () => {
  const empty = { ...stats, measure: null, hasMeasure: false };
  const { container } = render(
    <ShowcaseSlide profile={profile} stats={empty}
      findings={[]} active={true} topic="x" />,
  );
  expect(container.firstChild).toBeNull();
});
