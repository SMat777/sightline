import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import "../features/tool/riso.css";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="riso">
      <nav className="nav" aria-label="Primær">
        <div className="row">
          <Link to="/" className="mark" aria-label="Sightline, til forsiden">
            <svg className="glyph" viewBox="0 0 26 26" aria-hidden="true">
              <circle className="a" cx="10" cy="13" r="9" />
              <circle className="b" cx="16" cy="13" r="9" />
            </svg>
            Sightline <small>RISO·03</small>
          </Link>
          <span className="spacer" />
          <a
            className="nav-link"
            href="https://github.com/SMat777/sightline"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
          <Link to="/tool" className="btn">
            Åbn værktøjet
            <svg className="ar" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
