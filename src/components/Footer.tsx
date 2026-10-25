import { Link } from "@tanstack/react-router";

import logo from "@/assets/logo.png";

const PLATFORM_LINKS = [
  { to: "/", label: "Home" },
  { to: "/report", label: "Report an Issue" },
  { to: "/map", label: "Community Map" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

const INFO_LINKS = [
  { to: "/about", label: "About", hash: undefined },
  { to: "/about", label: "Contact", hash: "contact" },
  { to: "/about", label: "Privacy", hash: "privacy" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="CommunityGuardian logo" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-bold tracking-tight">
              Community<span className="text-primary">Guardian</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            An AI-powered civic issue reporting concept that helps citizens report local
            problems and draft formal complaints — all demonstrated fully in the browser.
          </p>
        </div>

        <nav aria-label="Platform links">
          <h2 className="text-sm font-semibold">Platform</h2>
          <ul className="mt-3 space-y-2">
            {PLATFORM_LINKS.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-sm text-muted-foreground hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Information links">
          <h2 className="text-sm font-semibold">Information</h2>
          <ul className="mt-3 space-y-2">
            {INFO_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  hash={item.hash}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground">Disclaimer:</strong>{" "}
            CommunityGuardian is a demonstration project built for learning and exhibition
            purposes. Reports are stored only in your browser, no submissions are sent to real
            municipal authorities, and all "AI" analysis is simulated. Sample reports marked
            "Demo" are fictional demonstration data.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} CommunityGuardian · AI for a Better Life
          </p>
        </div>
      </div>
    </footer>
  );
}
