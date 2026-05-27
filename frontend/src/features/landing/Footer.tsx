import { Link } from "@tanstack/react-router";

export default function Footer() {
  return (
    <footer className="landing-foot">
      <nav className="links" aria-label="Footer">
        <Link to="/tool">Værktøjet</Link>
        <a
          href="https://github.com/SMat777/sightline"
          target="_blank"
          rel="noopener"
        >
          GitHub
        </a>
        <a
          href="https://www.dst.dk"
          target="_blank"
          rel="noopener"
        >
          Danmarks Statistik
        </a>
        <a
          href="https://www.opendata.dk"
          target="_blank"
          rel="noopener"
        >
          Open Data DK
        </a>
      </nav>
    </footer>
  );
}
