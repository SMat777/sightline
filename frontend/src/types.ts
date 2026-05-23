// Mirrors the API's radar DTO contract (Sightline.Api/Dtos/RadarDtos.cs).
export type HourStatus = "Healthy" | "Watch" | "Critical";

export interface Hour {
  timestamp: string;
  spotPriceDkkKwh: number;
  co2IntensityGKwh: number;
  windShare: number;
  solarShare: number;
  fossilShare: number;
  score: number;
  status: HourStatus;
}

export interface Anomaly {
  timestamp: string;
  spotPriceDkkKwh: number;
  reason: string;
}

export interface BestWindow {
  start: string;
  end: string;
  avgScore: number;
  text: string;
}

export interface ZoneKpi {
  currentPrice: number;
  currentCo2: number;
  cheapestHour: string;
  cheapestPrice: number;
  renewableSharePct: number;
}

export interface ZoneRadar {
  zoneId: string;
  zoneName: string;
  date: string;
  kpis: ZoneKpi;
  bestWindow: BestWindow | null;
  hours: Hour[];
  anomalies: Anomaly[];
}

export interface RadarDay {
  date: string;
  zones: ZoneRadar[];
}

export interface CorrelationPoint {
  timestamp: string;
  windMs: number;
  spotPriceDkkKwh: number;
  renewableSharePct: number;
}

export interface Correlation {
  coefficient: number;
  points: CorrelationPoint[];
}
