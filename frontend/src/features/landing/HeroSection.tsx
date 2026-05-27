import { Link } from "@tanstack/react-router";

export default function HeroSection() {
  return (
    <section className="landing-hero">
      <span className="pill">Danmarks offentlige data — uden tabel-frygt</span>
      <h1>
        Find <span>signalet</span> i danske datasæt på sekunder.
      </h1>
      <p className="sub">
        Sightline aflæser hvert datasæt og lægger de nøgletal frem du kan
        forholde dig til. Ingen SQL, ingen pivot — bare en klar indgang til
        danske offentlige tal.
      </p>
      <div className="cta-row">
        <Link to="/tool" className="btn-primary">
          Start en analyse →
        </Link>
        <a href="#showcase" className="btn-secondary">
          Se eksempel
        </a>
      </div>
      <div className="proof">
        Bygget på <b>Danmarks Statistik</b> · <b>Open Data DK</b> ·{" "}
        <b>250+ datasæt</b> · gratis at bruge
      </div>
    </section>
  );
}
