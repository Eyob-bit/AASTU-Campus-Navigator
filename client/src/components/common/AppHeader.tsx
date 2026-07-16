import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Search" },
  { to: "/navigation", label: "Navigation" },
  { to: "/panorama", label: "Panorama" },
];

export function AppHeader() {
  const location = useLocation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <Link to="/" className="text-base font-bold text-slate-900">
        AASTU Campus Navigator
      </Link>
      <nav className="flex flex-wrap gap-2" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900",
              location.pathname === item.to && "bg-slate-200 text-slate-900"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
