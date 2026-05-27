import { Link } from "@tanstack/react-router";

export default function CtaBand() {
  return (
    <section className="cta-band">
      <div className="eyebrow">Klar til at se hvad dine data fortæller?</div>
      <Link to="/tool" className="big-btn">
        Åbn værktøjet →
      </Link>
    </section>
  );
}
