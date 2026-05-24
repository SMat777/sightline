import type { ZoneRadar } from "../types";

interface Props {
  zones: ZoneRadar[];
  active: string;
  onChange: (zoneId: string) => void;
}

// Segmented control for the two Danish price zones (DK1 west / DK2 east).
export default function ZoneTabs({ zones, active, onChange }: Props) {
  return (
    <div className="zonetabs" role="tablist" aria-label="Prisszone">
      {zones.map((z) => (
        <button
          key={z.zoneId}
          role="tab"
          aria-selected={z.zoneId === active}
          className={`zonetab${z.zoneId === active ? " on" : ""}`}
          onClick={() => onChange(z.zoneId)}
        >
          <span className="zonetab-id">{z.zoneId}</span>
          <span className="zonetab-name">{z.zoneName}</span>
        </button>
      ))}
    </div>
  );
}
