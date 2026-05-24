// Calm loading placeholder — same silhouette as the loaded dashboard so the
// page doesn't jump when data arrives.
export default function Skeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="sk-tabs" />
      <div className="sk-kpis">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sk-box sk-kpi" />
        ))}
      </div>
      <div className="sk-box sk-ribbon" />
      <div className="sk-two">
        <div className="sk-box sk-panel" />
        <div className="sk-box sk-panel" />
      </div>
    </div>
  );
}
