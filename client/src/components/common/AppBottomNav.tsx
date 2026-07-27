import { Link, useLocation } from "react-router-dom";
import { Home, Bot, Info, Users } from "lucide-react";
import { cn } from "@/utils";

const NAV_TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chatbot", label: "Chatbot", icon: Bot },
  { to: "/info", label: "Information", icon: Info },
  { to: "/about", label: "About Us", icon: Users },
] as const;

export function AppBottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pb-safe">
      <nav
        className="mx-auto max-w-lg border-t border-slate-800/80 bg-[#0B132B]/95 px-4 py-2 backdrop-blur-xl shadow-2xl shadow-black/80"
        aria-label="Bottom Navigation"
      >
        <div className="flex items-center justify-around">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to);

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200",
                  active ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
                )}
              >
                {/* Glowing icon pill indicator */}
                <div
                  className={cn(
                    "flex h-9 w-12 items-center justify-center rounded-2xl transition-all duration-300",
                    active
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/30 text-cyan-400 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-105"
                      : "bg-transparent text-slate-400"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                </div>
                <span className="text-[11px] font-medium tracking-tight">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
