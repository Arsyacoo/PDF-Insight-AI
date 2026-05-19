import { BarChart3, BrainCircuit, Clock3, FileUp, GitCompareArrows, Home, MessageSquareText, Share2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/upload", label: "Upload", icon: FileUp },
  { to: "/analysis", label: "Analysis", icon: BarChart3 },
  { to: "/chat", label: "Chat", icon: MessageSquareText },
  { to: "/learning", label: "Learning", icon: BrainCircuit },
  { to: "/compare", label: "Compare", icon: GitCompareArrows },
  { to: "/history", label: "History", icon: Clock3 },
];

export default function Sidebar() {
  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-line bg-soft p-4 md:flex">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-extrabold text-primary">PDF Insight AI</h1>
          <p className="text-sm font-medium text-muted">Smart Analysis</p>
        </div>
        <NavLink to="/upload" className="ai-gradient mb-6 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white shadow-soft">
          <FileUp size={18} /> New Analysis
        </NavLink>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-white text-primary shadow-sm" : "text-muted hover:bg-white/70 hover:text-ink"
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line pt-4 text-sm text-muted">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
              <Share2 size={18} />
            </div>
            <div>
              <p className="font-bold text-ink">Local Project</p>
              <p>Capstone Ready</p>
            </div>
          </div>
        </div>
      </aside>
      <nav className="fixed bottom-0 left-0 z-50 flex w-full gap-1 overflow-x-auto border-t border-line bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        {links.slice(1).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex min-w-16 flex-1 flex-col items-center gap-1 text-[11px] font-semibold ${isActive ? "text-primary" : "text-muted"}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
