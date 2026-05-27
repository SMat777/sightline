import { useEffect, useState } from "react";
import { fetchProfile, fetchStats } from "../../tool-api";
import type { DatasetProfile, StatPack } from "../../tool-types";
import ShowcaseSlide from "./ShowcaseSlide";
import { useShowcaseRotation } from "./useShowcaseRotation";

const SHOWCASE = [
  { id: "FOLK1A", topic: "Borgere" },
  { id: "BIL55", topic: "Transport" },
  { id: "ENEBR", topic: "Miljø & energi" },
] as const;

type Loaded = { profile: DatasetProfile; stats: StatPack; topic: string };

export default function ShowcaseSection() {
  const [data, setData] = useState<Loaded[] | null>(null);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const { index, setIndex, paused } = useShowcaseRotation({
    count: data?.length ?? 0,
    paused: hover || focused,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      SHOWCASE.map(async (s) => ({
        profile: await fetchProfile("danmarks-statistik", s.id),
        stats: await fetchStats("danmarks-statistik", s.id),
        topic: s.topic,
      })),
    )
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ShowcaseFallback />;
  if (!data) return <ShowcaseSkeleton />;

  const count = data.length;

  return (
    <section className="showcase" id="showcase" aria-label="Eksempler fra Sightline">
      <div
        className={`showcase-frame${paused ? " is-paused" : ""}`}
        aria-live="polite"
        tabIndex={0}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            setIndex((index + 1) % count);
            e.preventDefault();
          } else if (e.key === "ArrowLeft") {
            setIndex((index - 1 + count) % count);
            e.preventDefault();
          }
        }}
      >
        <div className="sw-bar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="label">sightline · showcase</span>
        </div>
        <div className="sw-body">
          {data.map((d, i) => (
            <ShowcaseSlide
              key={d.profile.id}
              profile={d.profile}
              stats={d.stats}
              topic={d.topic}
              active={i === index}
            />
          ))}
        </div>
        <div className="sw-dots" role="tablist" aria-label="Vælg eksempel">
          {data.map((d, i) => (
            <button
              key={d.profile.id}
              type="button"
              className={i === index ? "is-active" : ""}
              aria-label={d.profile.title}
              aria-selected={i === index}
              role="tab"
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseSkeleton() {
  return (
    <section className="showcase" id="showcase">
      <div className="showcase-skel" aria-busy="true">
        Henter eksempler…
      </div>
    </section>
  );
}

function ShowcaseFallback() {
  return (
    <section className="showcase showcase-fallback" id="showcase">
      <p>
        Eksempler kunne ikke hentes. <a href="/tool">Åbn værktøjet direkte →</a>
      </p>
    </section>
  );
}
