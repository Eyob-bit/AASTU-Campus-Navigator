import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Home,
  ChevronRight,
  Search,
  User,
  Settings,
  LogOut,
  Menu,
  Navigation,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { NAV_ITEMS } from "./Sidebar";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useTheme } from "@/context/ThemeContext";

interface AdminHeaderProps {
  onLogout: () => void;
  onMenuClick?: () => void;
}

export function AdminHeader({ onLogout, onMenuClick }: AdminHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAdminProfile();
  const { isDark, toggleTheme } = useTheme();

  const currentNav = NAV_ITEMS.find((n) => {
    if (n.path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(n.path);
  });

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 flex-shrink-0 transition-colors duration-200">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl flex-shrink-0 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
        <div className="lg:hidden w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Navigation size={14} className="text-white" />
        </div>
        <Link to="/dashboard" className="hidden lg:block text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
          <Home size={15} />
        </Link>
        {currentNav && currentNav.id !== "dashboard" ? (
          <>
            <ChevronRight size={13} className="text-gray-300 dark:text-slate-600 flex-shrink-0" />
            <span className="text-gray-900 dark:text-white font-semibold truncate text-xs sm:text-sm">{currentNav.label}</span>
          </>
        ) : (
          <span className="lg:hidden text-gray-900 dark:text-white font-semibold text-xs sm:text-sm truncate">AASTU Navigator</span>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
        <input
          placeholder="Search anything…"
          className="pl-9 pr-4 py-2 w-64 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:w-80 transition-all"
          readOnly
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded hidden lg:block">
          ⌘K
        </kbd>
      </div>

      {/* Dark / Light Mode Toggle */}
      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen((p) => !p); setDropdownOpen(false); }}
          className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer">Mark all read</span>
            </div>
            {PLACEHOLDER_NOTIFS.map((n, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", n.unread ? "bg-blue-600 dark:bg-blue-400" : "bg-transparent border border-gray-300 dark:border-slate-700")} />
                <div>
                  <p className="text-sm text-gray-800 dark:text-slate-200">{n.msg}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => { setDropdownOpen((p) => !p); setNotifOpen(false); }}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{profile.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{profile.role}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400 dark:text-slate-400" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-12 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 py-1.5">
            <button
              onClick={() => { navigate("/dashboard/profile"); setDropdownOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <User size={15} className="text-gray-400 dark:text-slate-400" /> My Profile
            </button>
            <button
              onClick={() => { navigate("/dashboard/settings"); setDropdownOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings size={15} className="text-gray-400 dark:text-slate-400" /> Settings
            </button>
            <div className="border-t border-gray-100 dark:border-slate-800 mt-1 pt-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

const PLACEHOLDER_NOTIFS = [
  { msg: "New panorama upload completed", time: "5m ago", unread: true },
  { msg: "Building MAB updated by admin",  time: "1h ago", unread: false },
  { msg: "Route data synced successfully", time: "3h ago", unread: true },
];
