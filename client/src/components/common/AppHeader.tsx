import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Map,
  Info,
  Users,
  Bot,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/utils";
import { useAppStore } from "@/store";

const NAV_ITEMS = [
  { to: "/",           label: "Home",         icon: Home },
  { to: "/navigation", label: "Campus Map",   icon: Map },
  { to: "/info",       label: "Information",  icon: Info },
  { to: "/about",      label: "About",        icon: Users },
  { to: "/chatbot",    label: "AI Assistant", icon: Bot },
] as const;

export function AppHeader() {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode, language, setLanguage } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Close mobile menu on route change */
  useEffect(() => setMobileOpen(false), [location.pathname]);

  /* Track scroll for navbar shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const isHomePage = location.pathname === "/";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled || mobileOpen || !isHomePage
            ? "bg-[#0B132B]/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/40"
            : "bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* ── Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="AASTU Campus Navigator home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-500/30">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
            </span>
            <span className="hidden font-display font-bold text-slate-900 dark:text-white sm:block">
              AASTU{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Navigator
              </span>
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className={cn(
                  "group flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive(to)
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                )}
                aria-current={isActive(to) ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110",
                    isActive(to) ? "text-white" : ""
                  )}
                  strokeWidth={2}
                />
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Right cluster ── */}
          <div className="flex items-center gap-2">
            {/* Search shortcut */}
            <Link
              to="/search"
              id="nav-search-btn"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Search campus"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </Link>

            {/* Language toggle */}
            <button
              id="nav-language-toggle"
              onClick={() => setLanguage(language === "en" ? "am" : "en")}
              className={cn(
                "hidden h-9 rounded-full px-3 text-xs font-semibold tracking-wide transition-all sm:flex items-center",
                "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
              aria-label={`Switch to ${language === "en" ? "Amharic" : "English"}`}
              title={`Switch to ${language === "en" ? "Amharic" : "English"}`}
            >
              {language === "en" ? "EN" : "አማ"}
            </button>

            {/* Dark mode toggle */}
            <button
              id="nav-dark-mode-toggle"
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="h-[18px] w-[18px] text-amber-400" strokeWidth={2} />
              ) : (
                <Moon className="h-[18px] w-[18px]" strokeWidth={2} />
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              id="nav-mobile-menu-toggle"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" strokeWidth={2} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div
            className="animate-slide-down border-t border-slate-200/60 dark:border-slate-800/60 lg:hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive(to)
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {label}
                </Link>
              ))}

              {/* Language in mobile */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Language
                </span>
                <button
                  onClick={() => setLanguage(language === "en" ? "am" : "en")}
                  className="rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {language === "en" ? "English" : "አማርኛ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer so content doesn't hide behind fixed nav on non-hero pages */}
      {!isHomePage && <div className="h-[60px]" aria-hidden="true" />}
    </>
  );
}
