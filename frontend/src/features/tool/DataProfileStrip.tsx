import type { DatasetProfile } from "../../tool-types";

// The calm "what am I looking at" line above the feed.
export default function DataProfileStrip({ profile }: { profile: DatasetProfile }) {
  const dims = profile.columns.filter((c) => c.role === "Dimension").length;
  const maal = profile.columns.filter((c) => c.role === "Maal").length;

  return (
    <div className="strip mono" aria-label="Datasæt-profil">
      <span className="strip-stat"><b>{profile.rowCount.toLocaleString("da-DK")}</b> rækker</span>
      <span className="strip-sep" aria-hidden="true">·</span>
      <span className="strip-stat"><b>{dims}</b> dimensioner</span>
      <span className="strip-sep" aria-hidden="true">·</span>
      <span className="strip-stat"><b>{maal}</b> mål</span>
      {profile.period && (
        <>
          <span className="strip-sep" aria-hidden="true">·</span>
          <span className="strip-stat">{profile.period}</span>
        </>
      )}
    </div>
  );
}
