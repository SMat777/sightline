// Mirrors the tool DTO contract (Sightline.Api/Dtos/ToolDtos.cs).

export interface Source {
  id: string;
  name: string;
}

export interface SubjectRef {
  id: string;
  name: string;
}

export interface DatasetRef {
  id: string;
  title: string;
  org: string | null;
  period: string | null;
  variables: number | null;
}

export type ColumnRole = "Maal" | "Dimension" | "Tid";
export type ColumnType = "Number" | "Category" | "Date";

export interface Column {
  name: string;
  role: ColumnRole;
  type: ColumnType;
  cardinality: number;
  nullRatio: number;
  min: number | null;
  max: number | null;
}

export interface DatasetProfile {
  id: string;
  source: string;
  title: string;
  rowCount: number;
  columns: Column[];
  period: string | null;
  unit: string | null;
}

export type FindingType =
  | "Anomali" | "Trend" | "Korrelation" | "Segment" | "Koncentration";

export interface Interestingness {
  score: number;
  styrke: number;
  overraskelse: number;
  sikkerhed: number;
  daekning: number;
}

export interface EvidencePoint {
  label: string;
  value: number;
}

export interface Evidence {
  viz: "sparkline" | "bars" | "scatter" | "pareto";
  points: EvidencePoint[];
  highlightIndex: number | null;
}

export interface Finding {
  type: FindingType;
  overskrift: string;
  interessanthed: Interestingness;
  bevis: Evidence;
}

// Stat-pack — relatable numbers per dataset (mirrors StatPackDto).
export interface Segment {
  key: string;
  value: number;
  share: number; // 0..1 of the total
}

export interface MeasureStats {
  column: string;
  count: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  spanRatio: number | null;
  stdDev: number;
}

export interface TimePoint {
  label: string;
  value: number;
}

export interface Bucket {
  from: number;
  to: number;
  count: number;
}

export interface NamedSeries {
  key: string;
  points: TimePoint[];
}

export interface StatPack {
  hasMeasure: boolean;
  hasDimension: boolean;
  hasTime: boolean;
  rowCount: number;
  measure: MeasureStats | null;
  topSegments: Segment[];
  segmentCount: number;
  topShare: number | null;
  gini: number | null;
  yoYPct: number | null;
  yoYLabel: string | null;
  outlierCount: number;
  series: TimePoint[];
  histogram: Bucket[];
  segmentSeries: NamedSeries[];
  allSegments: Segment[];
}
