import type { KeyboardEvent } from "react";
import type { ZoneRadar } from "../types";

interface Props {
  zones: ZoneRadar[];
  active: string;
  onChange: (zoneId: string) => void;
}

// Segmented control for the two Danish price zones (DK1 west / DK2 east).
// Implements the ARIA tabs pattern: roving tabindex + arrow/Home/End navigation,
// wired to the dashboard panel via aria-controls.
export default function ZoneTabs({ zones, active, onChange }: Props) {
  const activeIndex = Math.max(0, zones.findIndex((z) => z.zoneId === active));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next = activeIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (activeIndex + 1) % zones.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (activeIndex - 1 + zones.length) % zones.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = zones.length - 1;
    else return;
    e.preventDefault();
    onChange(zones[next].zoneId);
  };

  return (
    <div className="zonetabs" role="tablist" aria-label="Priszone" onKeyDown={onKeyDown}>
      {zones.map((z) => {
        const on = z.zoneId === active;
        return (
          <button
            key={z.zoneId}
            id={`tab-${z.zoneId}`}
            role="tab"
            aria-selected={on}
            aria-controls="dash-panel"
            tabIndex={on ? 0 : -1}
            className={`zonetab${on ? " on" : ""}`}
            onClick={() => onChange(z.zoneId)}
          >
            <span className="zonetab-id">{z.zoneId}</span>
            <span className="zonetab-name">{z.zoneName}</span>
          </button>
        );
      })}
    </div>
  );
}
