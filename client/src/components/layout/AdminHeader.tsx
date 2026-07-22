import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Bell, ChevronDown, Home, ChevronRight, Search, User, Settings, BookOpen, LogOut, Menu, Navigation } from "lucide-react";
import { cn } from "@/utils/cn";
import { NAV_ITEMS } from "./Sidebar";

interface AdminHeaderProps {
  onLogout: () => void;
  onMenuClick?: () => void;
}

export function AdminHeader({ onLogout, onMenuClick }: AdminHeaderProps) {
  const [notifOpen, setNotifOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const currentNav = NAV_ITEMS.find((n) => {
    if (n.path === "/dashboard") return location.pathname === "/dashboard";
    // nav-preview sub-routes (/nav-preview/:sceneId) should still resolve to the nav item
    return location.pathname.startsWith(n.path);
  });

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 flex-shrink-0">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl flex-shrink-0"
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
        <Link to="/dashboard" className="hidden lg:block text-gray-400 hover:text-gray-600 transition-colors">
          <Home size={15} />
        </Link>
        {currentNav && currentNav.id !== "dashboard" ? (
          <>
            <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
            <span className="text-gray-900 font-semibold truncate text-xs sm:text-sm">{currentNav.label}</span>
          </>
        ) : (
          <span className="lg:hidden text-gray-900 font-semibold text-xs sm:text-sm truncate">AASTU Navigator</span>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search anything…"
          className="pl-9 pr-4 py-2 w-64 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:w-80 transition-all"
          readOnly
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded hidden lg:block">
          ⌘K
        </kbd>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen((p) => !p); setDropdownOpen(false); }}
          className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              <span className="text-xs text-blue-600 font-medium cursor-pointer">Mark all read</span>
            </div>
            {PLACEHOLDER_NOTIFS.map((n, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", n.unread ? "bg-blue-600" : "bg-transparent border border-gray-300")} />
                <div>
                  <p className="text-sm text-gray-800">{n.msg}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
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
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            AD
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-tight">Admin User</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-1.5">
            {USER_MENU.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <item.icon size={15} className="text-gray-400" />
                {item.label}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
  { msg: "Announcement expiring tomorrow", time: "3h ago", unread: true },
];

const USER_MENU = [
  { label: "My Profile",    icon: User },
  { label: "Settings",      icon: Settings },
  { label: "Documentation", icon: BookOpen },
];
