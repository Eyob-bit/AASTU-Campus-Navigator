import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Building2, Layers, DoorOpen, Users,
  Search, Megaphone, Image, Map, Navigation, Settings,
  LogOut, ChevronLeft, ChevronRight,
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
  { id: "buildings",     label: "Buildings",           icon: Building2,       path: "/dashboard/buildings" },
  { id: "floors",        label: "Floors",              icon: Layers,          path: "/dashboard/floors" },
  { id: "offices",       label: "Offices",             icon: DoorOpen,        path: "/dashboard/offices" },
  { id: "staff",         label: "Staff",               icon: Users,           path: "/dashboard/staff" },
  { id: "aliases",       label: "Search Aliases",      icon: Search,          path: "/dashboard/aliases" },
  { id: "announcements", label: "Announcements",       icon: Megaphone,       path: "/dashboard/announcements" },
  { id: "panoramas",     label: "Panorama Scenes",     icon: Image,           path: "/dashboard/panoramas" },
  { id: "scene-editor",  label: "Scene Editor",        icon: Map,             path: "/dashboard/scene-editor" },
  { id: "nav-preview",   label: "Navigation Preview",  icon: Navigation,      path: "/dashboard/nav-preview" },
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
        "flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-[60px]" : "w-[228px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 min-h-[64px]">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Navigation size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 leading-tight whitespace-nowrap">
              AASTU Navigator
            </p>
            <p className="text-[10px] text-gray-500 whitespace-nowrap">Admin Dashboard</p>
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
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={cn("flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Collapse</span></>}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all cursor-pointer"
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
