import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Building2, Layers, DoorOpen, Users,
  Search, BarChart3, Image, Map, Navigation, Settings,
  LogOut, ChevronLeft, ChevronRight, MapPin, Compass, User,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",     label: "Dashboard",          icon: LayoutDashboard, path: "/dashboard" },
  { id: "analytics",     label: "Analytics",          icon: BarChart3,       path: "/dashboard/analytics" },
  { id: "buildings",     label: "Buildings",           icon: Building2,       path: "/dashboard/buildings" },
  { id: "floors",        label: "Floors",              icon: Layers,          path: "/dashboard/floors" },
  { id: "offices",       label: "Offices",             icon: DoorOpen,        path: "/dashboard/offices" },
  { id: "staff",         label: "Staff",               icon: Users,           path: "/dashboard/staff" },
  { id: "aliases",       label: "Search Aliases",      icon: Search,          path: "/dashboard/aliases" },
  { id: "panoramas",     label: "Panorama Scenes",     icon: Image,           path: "/dashboard/panoramas" },
  { id: "scene-editor",  label: "Scene Editor",        icon: Map,             path: "/dashboard/scene-editor" },
  { id: "nav-preview",   label: "Navigation Preview",  icon: Navigation,      path: "/dashboard/nav-preview" },
  { id: "road-network",  label: "Road Network",        icon: Compass,         path: "/dashboard/road-network" },
  { id: "landmarks",     label: "Landmarks",            icon: MapPin,          path: "/dashboard/landmarks" },

  { id: "profile",       label: "My Profile",          icon: User,            path: "/dashboard/profile" },
  { id: "settings",      label: "Settings",            icon: Settings,        path: "/dashboard/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

export function Sidebar({ collapsed, onToggle, onLogout }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-[60px]" : "w-[228px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-slate-800 min-h-[64px]">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Navigation size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight whitespace-nowrap">
              AASTU Navigator
            </p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 whitespace-nowrap">Admin Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id}
            to={path}
            end={path === "/dashboard"}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={cn("flex-shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-400")}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-gray-100 dark:border-slate-800 space-y-0.5">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Collapse</span></>}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
