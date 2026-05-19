import { Bell, CircleUserRound, Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar({ compact = false }) {
  return (
    <header className="fixed left-0 top-0 z-40 w-full border-b border-line/70 bg-surface/85 backdrop-blur-md">
      <div className={`mx-auto flex h-20 max-w-7xl items-center justify-between px-5 ${compact ? "md:pl-72" : ""}`}>
        <Link to="/" className="text-xl font-extrabold text-primary">
          PDF Insight AI
        </Link>
        {!compact && (
          <nav className="hidden items-center gap-8 text-sm font-semibold text-muted md:flex">
            <a href="#features" className="hover:text-primary">Features</a>
            <a href="#process" className="hover:text-primary">Process</a>
            <Link to="/upload" className="hover:text-primary">Upload</Link>
          </nav>
        )}
        <div className="flex items-center gap-3 text-muted">
          <button className="rounded-lg p-2 hover:bg-soft" aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button className="rounded-lg p-2 hover:bg-soft" aria-label="Profile">
            <CircleUserRound size={22} />
          </button>
          <button className="rounded-lg p-2 hover:bg-soft md:hidden" aria-label="Menu">
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
