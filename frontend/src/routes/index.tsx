import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: LandingPlaceholder });

function LandingPlaceholder() {
  return (
    <main style={{ padding: "60px 32px" }}>
      <h1>Sightline · landing kommer her</h1>
      <Link to="/tool">Åbn værktøjet →</Link>
    </main>
  );
}
