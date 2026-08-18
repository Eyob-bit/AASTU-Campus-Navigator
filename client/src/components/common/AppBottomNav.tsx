import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bot, Info, Users } from "lucide-react";
import { cn } from "@/utils";

const NAV_TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chatbot", label: "Chatbot", icon: Bot },
  { to: "/info", label: "Information", icon: Info },
  { to: "/about", label: "About Us", icon: Users },
] as const;

export function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] pb-safe">
      <nav
        className="mx-auto max-w-lg border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B132B]/95 px-4 py-2 backdrop-blur-xl shadow-lg dark:shadow-2xl dark:shadow-black/80 transition-colors"
        aria-label="Bottom Navigation"
      >
        <div className="flex items-center justify-around">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to);

            return (
              <button
                key={tab.to}
                type="button"
                onClick={() => {
                  navigate(tab.to);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200 cursor-pointer touch-manipulation",
                  active
                    ? "text-blue-600 dark:text-cyan-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                )}
                aria-label={tab.label}
              >
                {/* Glowing icon pill indicator */}
                <div
                  className={cn(
                    "flex h-9 w-12 items-center justify-center rounded-2xl transition-all duration-300",
                    active
                      ? "bg-blue-500/15 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-600/30 text-blue-600 dark:text-cyan-400 border border-blue-500/30 dark:border-cyan-400/40 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-105"
                      : "bg-transparent text-slate-500 dark:text-slate-400"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                </div>
                <span className="text-[11px] font-medium tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
