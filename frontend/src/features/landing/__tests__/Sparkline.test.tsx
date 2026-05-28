import { test, expect } from "vitest";
import { render } from "@testing-library/react";
import Sparkline from "../Sparkline";

test("renders empty when series < 2 points", () => {
  const { container } = render(<Sparkline series={[]} label="x" />);
  expect(container.querySelector("svg")).toBeNull();
});

test("renders polyline path for valid series", () => {
  const series = [
    { label: "2020", value: 100 },
    { label: "2021", value: 120 },
    { label: "2022", value: 140 },
  ];
  const { container } = render(<Sparkline series={series} label="Test" />);
  const poly = container.querySelector("polyline");
  expect(poly).not.toBeNull();
  expect(poly?.getAttribute("points")?.split(" ").length).toBe(3);
});

test("displays label and signed pct range", () => {
  const series = [
    { label: "2020", value: 100 },
    { label: "2026", value: 109 },
  ];
  const { container } = render(<Sparkline series={series} label="Befolkning" />);
  expect(container.querySelector(".lab")?.textContent).toBe("Befolkning");
  expect(container.querySelector(".rng")?.textContent).toMatch(/^\+9\.0%$/);
});
