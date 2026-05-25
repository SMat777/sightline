// Mirrors the tool DTO contract (Sightline.Api/Dtos/ToolDtos.cs).

export interface Source {
  id: string;
  name: string;
}

export interface DatasetRef {
  id: string;
  title: string;
  org: string | null;
}

export type ColumnRole = "Maal" | "Dimension" | "Tid";
export type ColumnType = "Number" | "Category" | "Date";

export interface Column {
  name: string;
  role: ColumnRole;
  type: ColumnType;
  cardinality: number;
  nullRatio: number;
}

export interface DatasetProfile {
  id: string;
  source: string;
  title: string;
  rowCount: number;
  columns: Column[];
  period: string | null;
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
