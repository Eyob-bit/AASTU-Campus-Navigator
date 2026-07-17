import { useState, useRef, useCallback } from "react";
import {
  LayoutDashboard, Building2, Layers, DoorOpen, Users, Search,
  Megaphone, Image, Map, Settings, LogOut, ChevronLeft, ChevronRight,
  Bell, ChevronDown, Plus, RefreshCw, Download, Filter, SortAsc,
  Eye, Pencil, Trash2, X, Check, AlertCircle, Info, CheckCircle2,
  ArrowLeft, ArrowRight, RotateCcw, ZoomIn, ZoomOut, Play, Save,
  Upload, MoreHorizontal, Home, Navigation, Wifi, Clock, Star,
  TrendingUp, Activity, Calendar, Mail, Phone, MapPin, Hash,
  ChevronUp, Minus, Menu, Lock, User, BookOpen, Crosshair,
  Move, MousePointer, Tag, Flag, SkipBack, SkipForward,
  RotateCw, Maximize2, Layers2, Grid3X3
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page =
  | "login" | "dashboard" | "buildings" | "floors" | "offices"
  | "staff" | "aliases" | "announcements" | "panoramas"
  | "scene-editor" | "nav-preview" | "settings" | "design-system";

type ModalType = "none" | "create" | "edit" | "delete" | "confirm" | "view";

interface Toast { id: number; type: "success" | "error" | "info"; message: string; }

// ─── Mock Data ────────────────────────────────────────────────────────────────
const BUILDINGS = [
  { id: 1, name: "Main Academic Block", code: "MAB", lat: 8.8836, lng: 38.8074, status: "active", floors: 5 },
  { id: 2, name: "Engineering Faculty", code: "ENG", lat: 8.8841, lng: 38.8079, status: "active", floors: 4 },
  { id: 3, name: "Library & Resource Center", code: "LRC", lat: 8.8829, lng: 38.8068, status: "active", floors: 3 },
  { id: 4, name: "Student Services Hub", code: "SSH", lat: 8.8845, lng: 38.8082, status: "inactive", floors: 2 },
  { id: 5, name: "Research & Innovation Center", code: "RIC", lat: 8.8852, lng: 38.8089, status: "active", floors: 6 },
];

const FLOORS = [
  { id: 1, building: "Main Academic Block", number: 1, label: "Ground Floor", panoramas: 12 },
  { id: 2, building: "Main Academic Block", number: 2, label: "First Floor", panoramas: 8 },
  { id: 3, building: "Engineering Faculty", number: 1, label: "Ground Floor", panoramas: 10 },
  { id: 4, building: "Library & Resource Center", number: 1, label: "Ground Floor", panoramas: 6 },
  { id: 5, building: "Research & Innovation Center", number: 3, label: "Third Floor", panoramas: 4 },
];

const OFFICES = [
  { id: 1, name: "Dean's Office", room: "101", building: "Main Academic Block", floor: "Ground Floor", status: "active" },
  { id: 2, name: "Registrar's Office", room: "102", building: "Main Academic Block", floor: "Ground Floor", status: "active" },
  { id: 3, name: "Computer Science Dept.", room: "201", building: "Engineering Faculty", floor: "First Floor", status: "active" },
  { id: 4, name: "Civil Engineering Dept.", room: "301", building: "Engineering Faculty", floor: "Second Floor", status: "inactive" },
  { id: 5, name: "Main Library", room: "G01", building: "Library & Resource Center", floor: "Ground Floor", status: "active" },
];

const STAFF = [
  { id: 1, name: "Dr. Abebe Girma", position: "Dean", office: "Dean's Office", email: "abebe.girma@aastu.edu.et", phone: "+251-911-234567", status: "active" },
  { id: 2, name: "Tigist Haile", position: "Registrar", office: "Registrar's Office", email: "tigist.haile@aastu.edu.et", phone: "+251-911-345678", status: "active" },
  { id: 3, name: "Yonas Tadesse", position: "Department Head", office: "Computer Science Dept.", email: "yonas.tadesse@aastu.edu.et", phone: "+251-911-456789", status: "active" },
  { id: 4, name: "Sara Bekele", position: "Librarian", office: "Main Library", email: "sara.bekele@aastu.edu.et", phone: "+251-911-567890", status: "active" },
  { id: 5, name: "Mulugeta Worku", position: "IT Manager", office: "Dean's Office", email: "mulugeta.worku@aastu.edu.et", phone: "+251-911-678901", status: "inactive" },
];

const ALIASES = [
  { id: 1, alias: "dean", target: "Dean's Office", type: "office" },
  { id: 2, alias: "library", target: "Main Library", type: "office" },
  { id: 3, alias: "cs dept", target: "Computer Science Dept.", type: "office" },
  { id: 4, alias: "dr abebe", target: "Dr. Abebe Girma", type: "staff" },
  { id: 5, alias: "registrar", target: "Registrar's Office", type: "office" },
];

const ANNOUNCEMENTS = [
  { id: 1, title: "Semester Registration Open", priority: "high", date: "2025-01-15", status: "active", content: "Registration for the second semester is now open. Visit the registrar's office." },
  { id: 2, title: "Library Hours Extended", priority: "medium", date: "2025-01-12", status: "active", content: "The library will remain open until 10 PM during exam season." },
  { id: 3, title: "Campus WiFi Maintenance", priority: "low", date: "2025-01-10", status: "expired", content: "WiFi maintenance scheduled for Saturday 2 AM - 6 AM." },
  { id: 4, title: "Graduation Ceremony Notice", priority: "high", date: "2025-01-08", status: "active", content: "Graduation ceremony for Class of 2024 on January 25th." },
];

const PANORAMAS = [
  { id: 1, name: "MAB Ground Entrance", floor: "MAB / Ground Floor", order: 1, isEntry: true },
  { id: 2, name: "MAB Corridor East", floor: "MAB / Ground Floor", order: 2, isEntry: false },
  { id: 3, name: "MAB Corridor West", floor: "MAB / Ground Floor", order: 3, isEntry: false },
  { id: 4, name: "ENG Main Lobby", floor: "ENG / Ground Floor", order: 1, isEntry: true },
  { id: 5, name: "LRC Reading Hall", floor: "LRC / Ground Floor", order: 1, isEntry: true },
  { id: 6, name: "RIC Research Wing", floor: "RIC / Third Floor", order: 1, isEntry: false },
];

const SCENE_LIST = [
  { id: "s1", name: "MAB Ground Entrance", thumb: "https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=80&fit=crop&auto=format", isEntry: true },
  { id: "s2", name: "MAB Corridor East", thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=120&h=80&fit=crop&auto=format", isEntry: false },
  { id: "s3", name: "MAB Corridor West", thumb: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=120&h=80&fit=crop&auto=format", isEntry: false },
  { id: "s4", name: "ENG Main Lobby", thumb: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=120&h=80&fit=crop&auto=format", isEntry: true },
];

const ACTIVITY = [
  { id: 1, action: "Building updated", detail: "Engineering Faculty floor count revised", time: "2 min ago", type: "edit" },
  { id: 2, action: "Office created", detail: "New research lab added to RIC Floor 3", time: "18 min ago", type: "create" },
  { id: 3, action: "Panorama uploaded", detail: "12 scenes uploaded for MAB Ground Floor", time: "1 hr ago", type: "upload" },
  { id: 4, action: "Staff member added", detail: "Dr. Yonas Tadesse joined CS Department", time: "3 hrs ago", type: "create" },
  { id: 5, action: "Announcement published", detail: "Semester Registration notice is live", time: "5 hrs ago", type: "publish" },
  { id: 6, action: "Search alias created", detail: "Alias 'registrar' → Registrar's Office", time: "Yesterday", type: "create" },
];

// ─── Utility Helpers ──────────────────────────────────────────────────────────
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-gray-50 text-gray-600 border-gray-200",
    expired: "bg-red-50 text-red-600 border-red-200",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border", map[status] ?? map.active)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", status === "active" ? "bg-emerald-500" : status === "inactive" ? "bg-gray-400" : "bg-red-400")} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", map[priority] ?? map.low)}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    office: "bg-purple-50 text-purple-700 border-purple-200",
    staff: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", map[type] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function Button({
  children, variant = "primary", size = "md", className = "", onClick, disabled, type = "button"
}: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg"; className?: string; onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary: "bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
    outline: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300 shadow-sm",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
}

function Input({
  label, type = "text", placeholder, value, onChange, icon, rightElement, className = ""
}: {
  label?: string; type?: string; placeholder?: string; value?: string;
  onChange?: (v: string) => void; icon?: React.ReactNode; rightElement?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange?.(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
            icon ? "pl-10" : "", rightElement ? "pr-10" : ""
          )}
        />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
    </div>
  );
}

function Textarea({ label, placeholder, value, onChange, rows = 4 }: {
  label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea rows={rows} placeholder={placeholder} value={value} onChange={e => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" />
    </div>
  );
}

function Select({ label, options, value, onChange }: {
  label?: string; options: { value: string; label: string }[]; value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <select value={value} onChange={e => onChange?.(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10 cursor-pointer">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function Switch({ label, checked, onChange }: { label?: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button type="button" onClick={() => onChange(!checked)}
        className={cn("relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1", checked ? "bg-blue-600" : "bg-gray-300")}>
        <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200", checked ? "translate-x-5" : "translate-x-1")} />
      </button>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label?: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button type="button" onClick={() => onChange(!checked)}
        className={cn("w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 transition-all flex items-center justify-center",
          checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300 hover:border-blue-400")}>
        {checked && <Check size={11} strokeWidth={3} className="text-white" />}
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm", className)}>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children, size = "md" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-white rounded-2xl shadow-2xl w-full", widths[size], "max-h-[90vh] overflow-y-auto")}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, description, danger }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", danger ? "bg-red-50" : "bg-blue-50")}>
            <AlertCircle size={20} className={danger ? "text-red-600" : "text-blue-600"} />
          </div>
          <p className="text-sm text-gray-600 pt-2">{description}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>
            {danger ? "Delete" : "Confirm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-100 rounded-xl", className)} />;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id}
          className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border min-w-[280px] max-w-[360px] bg-white",
            t.type === "success" ? "border-emerald-200" : t.type === "error" ? "border-red-200" : "border-blue-200")}>
          <span className={cn(t.type === "success" ? "text-emerald-600" : t.type === "error" ? "text-red-600" : "text-blue-600")}>
            {t.type === "success" ? <CheckCircle2 size={18} /> : t.type === "error" ? <AlertCircle size={18} /> : <Info size={18} />}
          </span>
          <p className="text-sm text-gray-800 flex-1">{t.message}</p>
          <button onClick={() => onRemove(t.id)} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}>
        <ChevronLeft size={14} />
      </Button>
      {Array.from({ length: Math.min(total, 5) }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={cn("w-8 h-8 rounded-lg text-sm font-medium transition-colors", p === current ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100")}>
          {p}
        </button>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}>
        <ChevronRight size={14} />
      </Button>
    </div>
  );
}

function TableToolbar({ search, setSearch, onAdd, addLabel }: {
  search: string; setSearch: (v: string) => void; onAdd?: () => void; addLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-100">
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
      <Button variant="outline" size="sm"><Filter size={14} />Filter</Button>
      <Button variant="outline" size="sm"><SortAsc size={14} />Sort</Button>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm"><RefreshCw size={14} /></Button>
        <Button variant="outline" size="sm"><Download size={14} />Export</Button>
        {onAdd && <Button variant="primary" size="sm" onClick={onAdd}><Plus size={14} />{addLabel || "Add"}</Button>}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "buildings", label: "Buildings", icon: Building2 },
  { id: "floors", label: "Floors", icon: Layers },
  { id: "offices", label: "Offices", icon: DoorOpen },
  { id: "staff", label: "Staff", icon: Users },
  { id: "aliases", label: "Search Aliases", icon: Search },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "panoramas", label: "Panorama Scenes", icon: Image },
  { id: "scene-editor", label: "Scene Editor", icon: Map },
  { id: "nav-preview", label: "Navigation Preview", icon: Navigation },
  { id: "settings", label: "Settings", icon: Settings },
];

function Sidebar({ current, onChange, collapsed, setCollapsed }: {
  current: Page; onChange: (p: Page) => void; collapsed: boolean; setCollapsed: (v: boolean) => void;
}) {
  return (
    <aside className={cn(
      "flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex-shrink-0",
      collapsed ? "w-[60px]" : "w-[228px]"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 min-h-[64px]">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Navigation size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 leading-tight whitespace-nowrap">AASTU Navigator</p>
            <p className="text-[10px] text-gray-500 whitespace-nowrap">Admin Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = current === item.id;
          return (
            <button key={item.id} onClick={() => onChange(item.id as Page)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}>
              <Icon size={17} className={cn("flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all cursor-pointer">
          {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Collapse</span></>}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all cursor-pointer">
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ page, onPageChange }: { page: Page; onPageChange: (p: Page) => void }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pageLabel = NAV_ITEMS.find(n => n.id === page)?.label ?? "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
        <button onClick={() => onPageChange("dashboard")} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Home size={15} />
        </button>
        {page !== "dashboard" && (
          <>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-900 font-medium truncate">{pageLabel}</span>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search anything…"
          className="pl-9 pr-4 py-2 w-64 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:w-80 transition-all" />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded hidden lg:block">⌘K</kbd>
      </div>

      {/* Notif */}
      <div className="relative">
        <button onClick={() => setNotifOpen(!notifOpen)}
          className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              <span className="text-xs text-blue-600 font-medium cursor-pointer">Mark all read</span>
            </div>
            {[
              { msg: "New panorama upload completed", time: "5m ago", dot: true },
              { msg: "Building MAB updated by admin", time: "1h ago", dot: false },
              { msg: "Announcement expiring tomorrow", time: "3h ago", dot: true },
            ].map((n, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", n.dot ? "bg-blue-600" : "bg-transparent border border-gray-300")} />
                <div>
                  <p className="text-sm text-gray-800">{n.msg}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative">
        <button onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            AD
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-tight">Admin User</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-1.5">
            {[
              { label: "My Profile", icon: User },
              { label: "Settings", icon: Settings },
              { label: "Documentation", icon: BookOpen },
            ].map(item => (
              <button key={item.label}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <item.icon size={15} className="text-gray-400" />
                {item.label}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={15} />Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@aastu.edu.et");
  const [password, setPassword] = useState("password");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-blue-600">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
        <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=900&h=1200&fit=crop&auto=format"
          alt="AASTU Campus" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Navigation size={18} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg">AASTU Navigator</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Campus Navigation<br />Made Simple
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
              Manage buildings, offices, panorama scenes, and help every visitor find their way across campus.
            </p>
            <div className="mt-10 flex flex-col gap-4">
              {[
                { icon: Building2, label: "5 Buildings managed", sub: "Across the AASTU campus" },
                { icon: Image, label: "200+ Panorama scenes", sub: "Immersive 360° navigation" },
                { icon: Users, label: "140+ Staff profiles", sub: "With office locations" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <item.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-blue-300 text-xs">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-blue-300 text-xs">© 2025 AASTU Campus Navigator. All rights reserved.</p>
        </div>
      </div>

      {/* Right / Login */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center p-8">
        <div className="w-full max-w-[380px]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Navigation size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">AASTU Navigator</p>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your administrator account</p>

          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Input label="Email address" type="email" placeholder="admin@aastu.edu.et" value={email} onChange={setEmail}
              icon={<Mail size={15} />} />
            <Input label="Password" type={showPass ? "text" : "password"} placeholder="Enter your password"
              value={password} onChange={setPassword} icon={<Lock size={15} />}
              rightElement={
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <Eye size={15} /> : <Eye size={15} />}
                </button>
              } />

            <div className="flex items-center justify-between">
              <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
                Forgot password?
              </button>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 cursor-pointer">
              {loading ? (
                <><svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Signing in…</>
              ) : "Sign in to Dashboard"}
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Need access? Contact your{" "}
            <span className="text-blue-600 font-medium cursor-pointer hover:underline">system administrator</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────
function DashboardHome({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const stats = [
    { label: "Total Buildings", value: "5", icon: Building2, color: "blue", change: "+1 this month" },
    { label: "Total Floors", value: "18", icon: Layers, color: "indigo", change: "+3 this month" },
    { label: "Total Offices", value: "47", icon: DoorOpen, color: "violet", change: "+5 this month" },
    { label: "Total Staff", value: "143", icon: Users, color: "emerald", change: "+12 this month" },
    { label: "Panorama Scenes", value: "212", icon: Image, color: "amber", change: "+24 this month" },
    { label: "Announcements", value: "4", icon: Megaphone, color: "rose", change: "2 active" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600", rose: "bg-rose-50 text-rose-600",
  };

  const quickActions = [
    { label: "Create Building", icon: Building2, page: "buildings" as Page, color: "bg-blue-600" },
    { label: "Add Office", icon: DoorOpen, page: "offices" as Page, color: "bg-violet-600" },
    { label: "Upload Panorama", icon: Upload, page: "panoramas" as Page, color: "bg-amber-600" },
    { label: "New Announcement", icon: Megaphone, page: "announcements" as Page, color: "bg-rose-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, Admin. Here's what's happening on campus.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={14} />
          <span>Last updated: just now</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="p-5 hover:shadow-md transition-shadow cursor-default">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorMap[s.color])}>
                <s.icon size={18} />
              </div>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{s.value}</p>
            <p className="text-sm font-medium text-gray-700">{s.label}</p>
            <p className="text-xs text-gray-400 mt-1">{s.change}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(a => (
              <button key={a.label} onClick={() => onNavigate(a.page)}
                className="flex flex-col items-center gap-2.5 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", a.color)}>
                  <a.icon size={16} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Recent Announcements */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Announcements</h2>
            <button onClick={() => onNavigate("announcements")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {ANNOUNCEMENTS.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", a.priority === "high" ? "bg-red-500" : a.priority === "medium" ? "bg-amber-500" : "bg-blue-500")} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.date}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Latest Building */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Latest Edited Building</h2>
          <div className="relative rounded-xl overflow-hidden mb-3 bg-gray-100" style={{ height: "120px" }}>
            <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=200&fit=crop&auto=format"
              alt="Engineering Faculty" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-sm font-semibold">Engineering Faculty</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={12} />
            <span>8.8841° N, 38.8079° E</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status="active" />
            <span className="text-xs text-gray-400 ml-auto">Edited 2 min ago</span>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</button>
        </div>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100" />
          <div className="space-y-4">
            {ACTIVITY.map((a, i) => {
              const typeIcon: Record<string, React.ReactNode> = {
                edit: <Pencil size={12} className="text-blue-600" />,
                create: <Plus size={12} className="text-emerald-600" />,
                upload: <Upload size={12} className="text-amber-600" />,
                publish: <Megaphone size={12} className="text-violet-600" />,
              };
              const typeColor: Record<string, string> = {
                edit: "bg-blue-50", create: "bg-emerald-50",
                upload: "bg-amber-50", publish: "bg-violet-50",
              };
              return (
                <div key={a.id} className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-4 border-white z-10", typeColor[a.type] ?? "bg-gray-50")}>
                    {typeIcon[a.type]}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-sm font-medium text-gray-900">{a.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.detail}</p>
                  </div>
                  <span className="text-xs text-gray-400 pt-2 flex-shrink-0">{a.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Buildings Page ───────────────────────────────────────────────────────────
function BuildingsPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>("none");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const filtered = BUILDINGS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buildings</h1>
          <p className="text-sm text-gray-500">{BUILDINGS.length} buildings on campus</p>
        </div>
      </div>

      <Card>
        <TableToolbar search={search} setSearch={setSearch} onAdd={() => setModal("create")} addLabel="Add Building" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Building Name", "Code", "Coordinates", "Floors", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={15} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{b.code}</code>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 font-mono text-xs">{b.lat.toFixed(4)}°N, {b.lng.toFixed(4)}°E</td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{b.floors} floors</td>
                  <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => setModal("edit")} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => { setDeleteTarget(b.id); setModal("delete"); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={<Building2 size={24} />} title="No buildings found" description="Try adjusting your search or add a new building." action={<Button variant="primary" size="sm" onClick={() => setModal("create")}><Plus size={14} />Add Building</Button>} />
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {BUILDINGS.length} buildings</p>
          <Pagination current={page} total={3} onChange={setPage} />
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal("none")}
        title={modal === "create" ? "Add Building" : "Edit Building"} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Building Name" placeholder="e.g. Main Academic Block" className="col-span-2" />
            <Input label="Building Code" placeholder="e.g. MAB" />
            <Select label="Status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
            <Input label="Latitude" placeholder="8.8836" />
            <Input label="Longitude" placeholder="38.8074" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
              <Upload size={20} className="text-gray-400" />
              <p className="text-xs text-gray-500 font-medium">Entrance Image</p>
              <p className="text-[10px] text-gray-400">Click to upload</p>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
              <Upload size={20} className="text-gray-400" />
              <p className="text-xs text-gray-500 font-medium">Cover Image</p>
              <p className="text-[10px] text-gray-400">Click to upload</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModal("none"); addToast({ type: "success", message: modal === "create" ? "Building created successfully." : "Building updated." }); }}>
              {modal === "create" ? "Create Building" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={modal === "delete"} onClose={() => setModal("none")}
        onConfirm={() => addToast({ type: "success", message: "Building deleted." })}
        title="Delete Building" description="Are you sure you want to delete this building? This action cannot be undone." danger />
    </div>
  );
}

// ─── Floors Page ──────────────────────────────────────────────────────────────
function FloorsPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>("none");
  const [page, setPage] = useState(1);

  const filtered = FLOORS.filter(f => f.building.toLowerCase().includes(search.toLowerCase()) || f.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Floors</h1>
        <p className="text-sm text-gray-500">{FLOORS.length} floors across all buildings</p>
      </div>
      <Card>
        <TableToolbar search={search} setSearch={setSearch} onAdd={() => setModal("create")} addLabel="Add Floor" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Building", "Floor Number", "Label", "Panoramas", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{f.building}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl">{f.number}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{f.label}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(f.panoramas / 15) * 100}%` }} />
                      </div>
                      <span className="text-sm text-gray-700">{f.panoramas}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={14} /></button>
                      <button onClick={() => setModal("edit")} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setModal("delete")} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Showing {filtered.length} floors</p>
          <Pagination current={page} total={2} onChange={setPage} />
        </div>
      </Card>

      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal("none")}
        title={modal === "create" ? "Add Floor" : "Edit Floor"} size="sm">
        <div className="space-y-4">
          <Select label="Building" options={BUILDINGS.map(b => ({ value: b.code, label: b.name }))} />
          <Input label="Floor Number" placeholder="e.g. 1" />
          <Input label="Floor Label" placeholder="e.g. Ground Floor" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModal("none"); addToast({ type: "success", message: "Floor saved." }); }}>Save Floor</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={modal === "delete"} onClose={() => setModal("none")} onConfirm={() => addToast({ type: "success", message: "Floor deleted." })}
        title="Delete Floor" description="Delete this floor and all associated panorama data?" danger />
    </div>
  );
}

// ─── Offices Page ─────────────────────────────────────────────────────────────
function OfficesPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>("none");
  const [page, setPage] = useState(1);

  const filtered = OFFICES.filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || o.room.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Offices</h1>
        <p className="text-sm text-gray-500">{OFFICES.length} offices registered</p>
      </div>
      <Card>
        <TableToolbar search={search} setSearch={setSearch} onAdd={() => setModal("create")} addLabel="Add Office" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Office Name", "Room", "Building", "Floor", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center"><DoorOpen size={15} className="text-violet-600" /></div>
                      <span className="text-sm font-medium text-gray-900">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{o.room}</code></td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{o.building}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{o.floor}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={14} /></button>
                      <button onClick={() => setModal("edit")} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setModal("delete")} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Showing {filtered.length} offices</p>
          <Pagination current={page} total={3} onChange={setPage} />
        </div>
      </Card>
      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal("none")}
        title={modal === "create" ? "Add Office" : "Edit Office"} size="md">
        <div className="space-y-4">
          <Input label="Office Name" placeholder="e.g. Dean's Office" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Room Number" placeholder="e.g. 101" />
            <Select label="Status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </div>
          <Select label="Building" options={BUILDINGS.map(b => ({ value: b.code, label: b.name }))} />
          <Select label="Floor" options={FLOORS.map(f => ({ value: String(f.id), label: `${f.building} – ${f.label}` }))} />
          <Textarea label="Description" placeholder="Brief description of this office…" rows={3} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModal("none"); addToast({ type: "success", message: "Office saved." }); }}>Save Office</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={modal === "delete"} onClose={() => setModal("none")} onConfirm={() => addToast({ type: "success", message: "Office deleted." })}
        title="Delete Office" description="Delete this office? Staff linked to it will need reassignment." danger />
    </div>
  );
}

// ─── Staff Page ───────────────────────────────────────────────────────────────
function StaffPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>("none");
  const [page, setPage] = useState(1);

  const filtered = STAFF.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.position.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Staff</h1>
        <p className="text-sm text-gray-500">{STAFF.length} staff members</p>
      </div>
      <Card>
        <TableToolbar search={search} setSearch={setSearch} onAdd={() => setModal("create")} addLabel="Add Staff" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Full Name", "Position", "Office", "Email", "Phone", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{s.position}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[160px] truncate">{s.office}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{s.email}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{s.phone}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={14} /></button>
                      <button onClick={() => setModal("edit")} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setModal("delete")} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Showing {filtered.length} staff members</p>
          <Pagination current={page} total={4} onChange={setPage} />
        </div>
      </Card>
      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal("none")}
        title={modal === "create" ? "Add Staff Member" : "Edit Staff Member"} size="md">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="e.g. Dr. Abebe Girma" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Position / Title" placeholder="e.g. Dean" />
            <Select label="Status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" placeholder="email@aastu.edu.et" icon={<Mail size={14} />} />
            <Input label="Phone" placeholder="+251-911-XXXXXX" icon={<Phone size={14} />} />
          </div>
          <Select label="Assigned Office" options={OFFICES.map(o => ({ value: String(o.id), label: o.name }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModal("none"); addToast({ type: "success", message: "Staff member saved." }); }}>Save Staff</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={modal === "delete"} onClose={() => setModal("none")} onConfirm={() => addToast({ type: "success", message: "Staff member removed." })}
        title="Remove Staff Member" description="Remove this staff member from the system? This won't delete their user account." danger />
    </div>
  );
}

// ─── Search Aliases Page ──────────────────────────────────────────────────────
function AliasesPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>("none");
  const [page, setPage] = useState(1);

  const filtered = ALIASES.filter(a => a.alias.toLowerCase().includes(search.toLowerCase()) || a.target.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Search Aliases</h1>
        <p className="text-sm text-gray-500">Keyword shortcuts that map to offices or staff</p>
      </div>
      <Card>
        <TableToolbar search={search} setSearch={setSearch} onAdd={() => setModal("create")} addLabel="Add Alias" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Alias", "Target", "Type", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Hash size={13} className="text-gray-400" />
                      <code className="text-sm font-mono font-medium text-gray-900">{a.alias}</code>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{a.target}</td>
                  <td className="px-4 py-3.5"><TypeBadge type={a.type} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal("edit")} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setModal("delete")} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Showing {filtered.length} aliases</p>
          <Pagination current={page} total={2} onChange={setPage} />
        </div>
      </Card>
      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal("none")}
        title={modal === "create" ? "Create Search Alias" : "Edit Alias"} size="sm">
        <div className="space-y-4">
          <Input label="Alias Keyword" placeholder="e.g. library" icon={<Hash size={14} />} />
          <Select label="Alias Type" options={[{ value: "office", label: "Office" }, { value: "staff", label: "Staff Member" }]} />
          <Select label="Target Office" options={OFFICES.map(o => ({ value: String(o.id), label: o.name }))} />
          <Select label="Target Staff" options={STAFF.map(s => ({ value: String(s.id), label: s.name }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModal("none"); addToast({ type: "success", message: "Alias saved." }); }}>Save Alias</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={modal === "delete"} onClose={() => setModal("none")} onConfirm={() => addToast({ type: "success", message: "Alias deleted." })}
        title="Delete Alias" description="Remove this search alias?" danger />
    </div>
  );
}

// ─── Announcements Page ───────────────────────────────────────────────────────
function AnnouncementsPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>("none");
  const [page, setPage] = useState(1);

  const filtered = ANNOUNCEMENTS.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500">Campus-wide notices displayed in the navigation app</p>
      </div>
      <Card>
        <TableToolbar search={search} setSearch={setSearch} onAdd={() => setModal("create")} addLabel="New Announcement" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Title", "Priority", "Created Date", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center"><Megaphone size={14} className="text-rose-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 max-w-[260px] truncate">{a.content}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><PriorityBadge priority={a.priority} /></td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{a.date}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={14} /></button>
                      <button onClick={() => setModal("edit")} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setModal("delete")} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Showing {filtered.length} announcements</p>
          <Pagination current={page} total={2} onChange={setPage} />
        </div>
      </Card>
      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal("none")}
        title={modal === "create" ? "Create Announcement" : "Edit Announcement"} size="md">
        <div className="space-y-4">
          <Input label="Title" placeholder="Announcement title…" />
          <Textarea label="Content" placeholder="Write the full announcement text here…" rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" options={[{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
            <Input label="Expiration Date" type="date" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModal("none"); addToast({ type: "success", message: "Announcement published." }); }}>Publish</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={modal === "delete"} onClose={() => setModal("none")} onConfirm={() => addToast({ type: "success", message: "Announcement deleted." })}
        title="Delete Announcement" description="Remove this announcement? Users will no longer see it." danger />
    </div>
  );
}

// ─── Panoramas Page ───────────────────────────────────────────────────────────
function PanoramasPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>("none");
  const [filter, setFilter] = useState("all");

  const PANO_IMGS = [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=250&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=250&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=250&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=400&h=250&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop&auto=format",
  ];

  const filtered = PANORAMAS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "entry" && p.isEntry);
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Panorama Scenes</h1>
          <p className="text-sm text-gray-500">{PANORAMAS.length} scenes across all floors</p>
        </div>
        <Button variant="primary" onClick={() => setModal("create")}><Upload size={14} />Upload Panorama</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search scenes…"
            className="pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-60" />
        </div>
        {["all", "entry", "MAB", "ENG", "LRC"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-medium transition-all", filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}>
            {f === "all" ? "All Scenes" : f === "entry" ? "Entry Points" : f}
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => (
          <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-shadow">
            <div className="relative bg-gray-100" style={{ height: "160px" }}>
              <img src={PANO_IMGS[i % PANO_IMGS.length]} alt={p.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                <div className="flex gap-2">
                  <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => setModal("edit")} className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setModal("delete")} className="w-8 h-8 bg-red-500/70 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-red-600/80 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {p.isEntry && (
                <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={9} />Entry
                </span>
              )}
              <span className="absolute top-2.5 right-2.5 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                #{p.order}
              </span>
            </div>
            <div className="p-3.5">
              <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Layers size={11} className="text-gray-400" />
                <p className="text-xs text-gray-500 truncate">{p.floor}</p>
              </div>
            </div>
          </Card>
        ))}

        {/* Upload card */}
        <button onClick={() => setModal("create")}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-all group cursor-pointer min-h-[220px]">
          <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-2xl flex items-center justify-center transition-colors">
            <Upload size={20} className="text-gray-400 group-hover:text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600 group-hover:text-blue-700">Upload Panorama</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, or 360° images</p>
          </div>
        </button>
      </div>

      <Modal open={modal === "create"} onClose={() => setModal("none")} title="Upload Panorama Scene" size="md">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center"><Upload size={20} className="text-amber-600" /></div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Drop panorama image here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse — JPG, PNG, max 50MB</p>
            </div>
            <Button variant="outline" size="sm">Browse Files</Button>
          </div>
          <Input label="Scene Name" placeholder="e.g. MAB Ground Entrance" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Building" options={BUILDINGS.map(b => ({ value: b.code, label: b.name }))} />
            <Select label="Floor" options={FLOORS.map(f => ({ value: String(f.id), label: f.label }))} />
          </div>
          <Input label="Display Order" placeholder="1" type="number" />
          <Switch label="Mark as Entry Scene" checked={false} onChange={() => {}} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModal("none")}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModal("none"); addToast({ type: "success", message: "Panorama uploaded successfully." }); }}>Upload Scene</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={modal === "delete"} onClose={() => setModal("none")} onConfirm={() => addToast({ type: "success", message: "Scene deleted." })}
        title="Delete Scene" description="Delete this panorama scene? Navigation arrows pointing to it will be removed." danger />
    </div>
  );
}

// ─── Scene Editor ─────────────────────────────────────────────────────────────
interface Marker { id: string; type: "arrow" | "label" | "info"; x: number; y: number; label: string; target?: string; rotation: number; }

function SceneEditorPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [selectedScene, setSelectedScene] = useState(SCENE_LIST[0]);
  const [sceneSearch, setSceneSearch] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([
    { id: "m1", type: "arrow", x: 35, y: 55, label: "To Corridor", target: "s2", rotation: 45 },
    { id: "m2", type: "label", x: 65, y: 40, label: "Dean's Office", rotation: 0 },
    { id: "m3", type: "info", x: 50, y: 70, label: "Information", rotation: 0 },
  ]);
  const [activeTool, setActiveTool] = useState<"arrow" | "label" | "info" | "select">("select");
  const [autoSave, setAutoSave] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const filteredScenes = SCENE_LIST.filter(s => s.name.toLowerCase().includes(sceneSearch.toLowerCase()));

  const handleViewerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "select" || isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newMarker: Marker = { id: `m${Date.now()}`, type: activeTool, x, y, label: activeTool === "arrow" ? "Go →" : activeTool === "label" ? "Office" : "Info", rotation: 0 };
    setMarkers(prev => [...prev, newMarker]);
    setSelectedMarker(newMarker);
  }, [activeTool, isDragging]);

  const handleMarkerMouseDown = (e: React.MouseEvent, marker: Marker) => {
    e.stopPropagation();
    setSelectedMarker(marker);
    if (activeTool !== "select") return;
    setDragId(marker.id);
    setIsDragging(false);
    const startX = e.clientX, startY = e.clientY;
    const rect = viewerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const onMove = (me: MouseEvent) => {
      if (Math.abs(me.clientX - startX) > 3 || Math.abs(me.clientY - startY) > 3) setIsDragging(true);
      const nx = ((me.clientX - rect.left) / rect.width) * 100;
      const ny = ((me.clientY - rect.top) / rect.height) * 100;
      setMarkers(prev => prev.map(m => m.id === marker.id ? { ...m, x: Math.max(2, Math.min(98, nx)), y: Math.max(2, Math.min(98, ny)) } : m));
    };
    const onUp = () => { setDragId(null); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const markerStyle = (m: Marker) => {
    const colors = { arrow: "bg-blue-600 border-blue-400", label: "bg-violet-600 border-violet-400", info: "bg-amber-500 border-amber-400" };
    const icons = { arrow: <ArrowRight size={12} className="text-white" />, label: <Tag size={12} className="text-white" />, info: <Info size={12} className="text-white" /> };
    return { colors: colors[m.type], icon: icons[m.type] };
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel */}
      <div className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scenes</p>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={sceneSearch} onChange={e => setSceneSearch(e.target.value)} placeholder="Search scenes…"
              className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="p-2 border-b border-gray-100">
          <Select label="" options={BUILDINGS.map(b => ({ value: b.code, label: b.name }))} />
          <div className="mt-2">
            <Select label="" options={FLOORS.map(f => ({ value: String(f.id), label: f.label }))} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredScenes.map(s => (
            <button key={s.id} onClick={() => { setSelectedScene(s); setSelectedMarker(null); }}
              className={cn("w-full flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-left", selectedScene.id === s.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50")}>
              <img src={s.thumb} alt={s.name} className="w-10 h-7 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{s.name}</p>
                {s.isEntry && <span className="text-[9px] text-blue-600 font-semibold">ENTRY</span>}
              </div>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-gray-100">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 font-medium bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
            <Upload size={13} />Upload New Scene
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-gray-100 flex items-center px-4 gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mr-2">
            {[
              { tool: "select" as const, icon: <MousePointer size={14} />, label: "Select" },
              { tool: "arrow" as const, icon: <ArrowRight size={14} />, label: "Arrow" },
              { tool: "label" as const, icon: <Tag size={14} />, label: "Office Label" },
              { tool: "info" as const, icon: <Info size={14} />, label: "Info" },
            ].map(t => (
              <button key={t.tool} onClick={() => setActiveTool(t.tool)} title={t.label}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                  activeTool === t.tool ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Undo"><RotateCcw size={15} /></button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Redo"><RotateCw size={15} /></button>
          </div>
          <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><ZoomOut size={15} /></button>
            <span className="text-xs font-mono text-gray-600 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><ZoomIn size={15} /></button>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {autoSave && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Auto-saved
              </div>
            )}
            <Button variant="outline" size="sm"><Play size={13} />Preview</Button>
            <Button variant="primary" size="sm" onClick={() => addToast({ type: "success", message: "Scene changes saved." })}><Save size={13} />Save Changes</Button>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
          <div
            ref={viewerRef}
            onClick={handleViewerClick}
            className={cn("relative bg-gray-200 rounded-2xl overflow-hidden shadow-xl border border-gray-200", activeTool !== "select" ? "cursor-crosshair" : "cursor-default")}
            style={{ width: `${Math.min(100, zoom)}%`, maxWidth: "900px", aspectRatio: "16/8" }}>
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop&auto=format"
              alt="Panorama scene" className="w-full h-full object-cover select-none pointer-events-none" draggable={false} />
            <div className="absolute inset-0 bg-black/10" />

            {/* Markers */}
            {markers.map(m => {
              const { colors, icon } = markerStyle(m);
              const isSelected = selectedMarker?.id === m.id;
              return (
                <div key={m.id}
                  onMouseDown={e => handleMarkerMouseDown(e, m)}
                  style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%, -50%)", userSelect: "none" }}
                  className={cn("absolute flex flex-col items-center gap-1 group", activeTool === "select" ? "cursor-grab active:cursor-grabbing" : "cursor-default")}>
                  <div className={cn("w-8 h-8 rounded-xl border-2 flex items-center justify-center shadow-lg transition-transform", colors, isSelected ? "scale-125 ring-2 ring-white ring-offset-1" : "hover:scale-110")}>
                    {icon}
                  </div>
                  {m.label && (
                    <span className="bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-md whitespace-nowrap backdrop-blur-sm font-medium">
                      {m.label}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Scene label */}
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-xl font-medium">
              {selectedScene.name}
            </div>
          </div>
        </div>
      </div>

      {/* Right Properties Panel */}
      <div className="w-64 bg-white border-l border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Properties</p>
        </div>
        {selectedMarker ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marker Type</p>
              <div className="flex gap-2">
                {(["arrow", "label", "info"] as const).map(t => (
                  <button key={t} onClick={() => { setMarkers(prev => prev.map(m => m.id === selectedMarker.id ? { ...m, type: t } : m)); setSelectedMarker(prev => prev ? { ...prev, type: t } : prev); }}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all", selectedMarker.type === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">X Position</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-700">{selectedMarker.x.toFixed(1)}%</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Y Position</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-700">{selectedMarker.y.toFixed(1)}%</div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Rotation</label>
              <input type="range" min={0} max={360} value={selectedMarker.rotation}
                onChange={e => { const r = Number(e.target.value); setMarkers(prev => prev.map(m => m.id === selectedMarker.id ? { ...m, rotation: r } : m)); setSelectedMarker(prev => prev ? { ...prev, rotation: r } : prev); }}
                className="w-full accent-blue-600" />
              <span className="text-xs text-gray-500">{selectedMarker.rotation}°</span>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Label Text</label>
              <input value={selectedMarker.label}
                onChange={e => { setMarkers(prev => prev.map(m => m.id === selectedMarker.id ? { ...m, label: e.target.value } : m)); setSelectedMarker(prev => prev ? { ...prev, label: e.target.value } : prev); }}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            {selectedMarker.type === "arrow" && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Target Scene</label>
                <select className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                  {SCENE_LIST.map(s => <option key={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {selectedMarker.type === "label" && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Office</label>
                <select className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                  {OFFICES.map(o => <option key={o.id}>{o.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => addToast({ type: "success", message: "Marker saved." })}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                <Save size={12} />Save Marker
              </button>
              <button onClick={() => { setMarkers(prev => prev.filter(m => m.id !== selectedMarker.id)); setSelectedMarker(null); }}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                <Trash2 size={12} />Delete Marker
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
              <MousePointer size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No marker selected</p>
            <p className="text-xs text-gray-400 mt-1">Click a marker to edit its properties, or select a tool to add a new one.</p>
          </div>
        )}

        {/* Legend */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Marker Legend</p>
          {[
            { type: "arrow", color: "bg-blue-600", label: "Navigation Arrow" },
            { type: "label", color: "bg-violet-600", label: "Office Label" },
            { type: "info", color: "bg-amber-500", label: "Information" },
          ].map(item => (
            <div key={item.type} className="flex items-center gap-2">
              <div className={cn("w-5 h-5 rounded-md flex-shrink-0", item.color)} />
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Navigation Preview ───────────────────────────────────────────────────────
function NavPreviewPage() {
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState("Dean's Office");
  const [started, setStarted] = useState(false);

  const path = [
    { scene: SCENE_LIST[0], instruction: "Enter through the main entrance" },
    { scene: SCENE_LIST[1], instruction: "Walk straight along the east corridor" },
    { scene: SCENE_LIST[2], instruction: "Turn left at the intersection" },
    { scene: SCENE_LIST[3], instruction: "You have arrived at your destination" },
  ];

  const current = path[step];

  const SCENE_IMGS = [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=900&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&h=500&fit=crop&auto=format",
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Navigation Preview</h1>
          <p className="text-sm text-gray-500">Simulate what end users experience</p>
        </div>
        <div className="flex items-center gap-2">
          <Select label="" options={OFFICES.map(o => ({ value: o.name, label: o.name }))} value={destination} onChange={setDestination} />
          {!started ? (
            <Button variant="primary" onClick={() => { setStarted(true); setStep(0); }}><Play size={14} />Start Navigation</Button>
          ) : (
            <Button variant="outline" onClick={() => { setStarted(false); setStep(0); }}><RotateCcw size={14} />Restart</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main viewer */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="overflow-hidden">
            <div className="relative bg-gray-900" style={{ aspectRatio: "16/9" }}>
              <img src={SCENE_IMGS[step]} alt={current.scene.name}
                className="w-full h-full object-cover transition-all duration-500" />

              {/* Overlay UI */}
              {started && (
                <>
                  {/* Top bar */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-xl flex items-center gap-2">
                      <Navigation size={13} />
                      <span>To: <strong>{destination}</strong></span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-xl">
                      Step {step + 1} of {path.length}
                    </div>
                  </div>

                  {/* Center instruction */}
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-max max-w-[80%] bg-black/70 backdrop-blur-sm text-white text-sm px-5 py-3 rounded-2xl text-center font-medium">
                    {current.instruction}
                  </div>

                  {/* Arrow overlay */}
                  {step < path.length - 1 && (
                    <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
                      <div className="w-14 h-14 bg-blue-600/80 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce shadow-lg">
                        <ArrowRight size={24} className="text-white" style={{ transform: step === 1 ? "rotate(0deg)" : step === 2 ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </div>
                    </div>
                  )}

                  {step === path.length - 1 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-emerald-600/90 backdrop-blur-sm text-white px-8 py-6 rounded-2xl text-center shadow-2xl">
                        <CheckCircle2 size={40} className="mx-auto mb-2" />
                        <p className="text-lg font-bold">You have arrived!</p>
                        <p className="text-sm opacity-80 mt-1">{destination}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!started && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center text-white">
                    <Navigation size={48} className="mx-auto mb-3 opacity-80" />
                    <p className="text-lg font-semibold">Select a destination and start navigation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Nav controls */}
            {started && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
                  <SkipBack size={14} />Previous
                </Button>
                <div className="flex gap-1.5">
                  {path.map((_, i) => (
                    <div key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-blue-600" : i < step ? "w-3 bg-blue-300" : "w-3 bg-gray-200")} />
                  ))}
                </div>
                <Button variant={step === path.length - 1 ? "secondary" : "primary"}
                  onClick={() => step < path.length - 1 ? setStep(s => s + 1) : undefined} disabled={step === path.length - 1}>
                  {step === path.length - 1 ? "Arrived" : "Next"}<SkipForward size={14} />
                </Button>
              </div>
            )}
          </Card>

          {/* Scene thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {path.map((p, i) => (
              <button key={i} onClick={() => started && setStep(i)}
                className={cn("relative flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all", i === step && started ? "border-blue-600" : "border-transparent")}>
                <img src={SCENE_IMGS[i]} alt={p.scene.name} className="w-28 h-16 object-cover" />
                <div className={cn("absolute inset-0 bg-black/30 flex items-center justify-center", i < step && started ? "opacity-100" : "opacity-0 hover:opacity-50 transition-opacity")}>
                  {i < step && started && <Check size={20} className="text-white" />}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1.5 py-0.5 truncate">{p.scene.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel: mini map + path */}
        <div className="space-y-4">
          {/* Mini map */}
          <Card className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mini Map</p>
            <div className="relative bg-blue-50 rounded-xl border border-blue-100 overflow-hidden" style={{ aspectRatio: "1/1" }}>
              {/* Simplified floor plan */}
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <rect x="10" y="10" width="180" height="180" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
                <rect x="20" y="20" width="70" height="50" rx="4" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5" />
                <rect x="110" y="20" width="70" height="50" rx="4" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5" />
                <rect x="20" y="130" width="70" height="50" rx="4" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5" />
                <rect x="110" y="130" width="70" height="50" rx="4" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="100" y1="20" x2="100" y2="180" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
                <line x1="20" y1="100" x2="180" y2="100" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
                {/* Path */}
                {started && <polyline points="100,180 100,120 50,120 50,45" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" />}
                {/* User dot */}
                {started && (
                  <circle cx={[100, 100, 50, 50][step] ?? 100} cy={[180, 120, 120, 45][step] ?? 180} r="8" fill="#2563eb" stroke="white" strokeWidth="3" />
                )}
                {/* Destination */}
                <circle cx="50" cy="45" r="6" fill="#10b981" stroke="white" strokeWidth="2" />
              </svg>
            </div>
          </Card>

          {/* Path list */}
          <Card className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Route Steps</p>
            <div className="space-y-2">
              {path.map((p, i) => (
                <div key={i} className={cn("flex items-start gap-2.5 p-2 rounded-xl transition-colors", i === step && started ? "bg-blue-50" : "")}>
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5",
                    i < step && started ? "bg-emerald-500 text-white" : i === step && started ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500")}>
                    {i < step && started ? <Check size={10} /> : i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{p.scene.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{p.instruction}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
function SettingsPage({ addToast }: { addToast: (t: Omit<Toast, "id">) => void }) {
  const [tab, setTab] = useState("general");
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const tabs = ["general", "security", "notifications", "integrations"];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage system configuration and preferences</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all", tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-900">University Information</h2>
            <Input label="University Name" value="Addis Ababa Science and Technology University" onChange={() => {}} />
            <Input label="Admin Email" value="admin@aastu.edu.et" onChange={() => {}} icon={<Mail size={14} />} />
            <Input label="Support Phone" value="+251-11-XXXXXXX" onChange={() => {}} icon={<Phone size={14} />} />
            <Textarea label="System Description" value="AASTU Campus Navigation Admin Dashboard" rows={2} />
            <Button variant="primary" onClick={() => addToast({ type: "success", message: "Settings saved." })}>Save Changes</Button>
          </Card>
          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-900">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-save Scene Editor</p>
                  <p className="text-xs text-gray-500">Save changes automatically every 30s</p>
                </div>
                <Switch checked={autoSave} onChange={setAutoSave} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive alerts for system events</p>
                </div>
                <Switch checked={notifications} onChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                  <p className="text-xs text-gray-500">Use dark theme across the dashboard</p>
                </div>
                <Switch checked={darkMode} onChange={setDarkMode} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "security" && (
        <Card className="p-6 space-y-5 max-w-lg">
          <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
          <Input label="Confirm New Password" type="password" placeholder="••••••••" />
          <Button variant="primary" onClick={() => addToast({ type: "success", message: "Password changed successfully." })}>Update Password</Button>
        </Card>
      )}

      {tab === "notifications" && (
        <Card className="p-6 space-y-4 max-w-lg">
          <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
          {["New panorama uploads", "Building edits", "Staff changes", "Announcement expiry", "System errors"].map(item => (
            <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{item}</span>
              <Switch checked={true} onChange={() => {}} />
            </div>
          ))}
          <Button variant="primary" onClick={() => addToast({ type: "success", message: "Notification settings saved." })}>Save Preferences</Button>
        </Card>
      )}

      {tab === "integrations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { name: "Google Maps API", desc: "Used for building coordinates and maps", connected: true, icon: "🗺️" },
            { name: "Cloudinary", desc: "Panorama image hosting and CDN", connected: true, icon: "☁️" },
            { name: "Firebase", desc: "Real-time database for navigation data", connected: false, icon: "🔥" },
          ].map(int => (
            <Card key={int.name} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{int.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{int.name}</p>
                  <StatusBadge status={int.connected ? "active" : "inactive"} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">{int.desc}</p>
              <Button variant={int.connected ? "outline" : "primary"} size="sm" className="w-full justify-center">
                {int.connected ? "Configure" : "Connect"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Design System Showcase ───────────────────────────────────────────────────
function DesignSystemPage() {
  const [switchOn, setSwitchOn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Design System</h1>
        <p className="text-sm text-gray-500">Component library for AASTU Campus Navigator Admin</p>
      </div>

      {/* Buttons */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary"><Plus size={14} />With Icon</Button>
        </div>
      </Card>

      {/* Inputs */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Inputs</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Text Input" placeholder="Type something…" />
          <Input label="Search" placeholder="Search…" icon={<Search size={14} />} />
          <Input label="Password" type="password" placeholder="Password" icon={<Lock size={14} />} />
          <Select label="Dropdown" options={[{ value: "a", label: "Option A" }, { value: "b", label: "Option B" }]} />
        </div>
        <Textarea label="Textarea" placeholder="Enter longer text here…" rows={3} />
        <div className="flex items-center gap-8">
          <Switch label="Toggle Switch" checked={switchOn} onChange={setSwitchOn} />
          <Checkbox label="Checkbox" checked={checked} onChange={setChecked} />
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="active" />
          <StatusBadge status="inactive" />
          <StatusBadge status="expired" />
          <PriorityBadge priority="high" />
          <PriorityBadge priority="medium" />
          <PriorityBadge priority="low" />
          <TypeBadge type="office" />
          <TypeBadge type="staff" />
        </div>
      </Card>

      {/* Alerts */}
      <Card className="p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Alerts</h2>
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div><p className="text-sm font-medium text-blue-900">Information</p><p className="text-xs text-blue-700 mt-0.5">This is an informational message.</p></div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div><p className="text-sm font-medium text-emerald-900">Success</p><p className="text-xs text-emerald-700 mt-0.5">Operation completed successfully.</p></div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div><p className="text-sm font-medium text-red-900">Error</p><p className="text-xs text-red-700 mt-0.5">Something went wrong. Please try again.</p></div>
        </div>
      </Card>

      {/* Loading Skeletons */}
      <Card className="p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Loading Skeletons</h2>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex gap-3 mt-2">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Card>

      {/* Empty State */}
      <Card>
        <EmptyState
          icon={<Building2 size={24} />}
          title="No buildings yet"
          description="Add your first building to get started with campus navigation."
          action={<Button variant="primary" size="sm"><Plus size={14} />Add Building</Button>}
        />
      </Card>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toastId = useRef(0);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardHome onNavigate={setPage} />;
      case "buildings": return <BuildingsPage addToast={addToast} />;
      case "floors": return <FloorsPage addToast={addToast} />;
      case "offices": return <OfficesPage addToast={addToast} />;
      case "staff": return <StaffPage addToast={addToast} />;
      case "aliases": return <AliasesPage addToast={addToast} />;
      case "announcements": return <AnnouncementsPage addToast={addToast} />;
      case "panoramas": return <PanoramasPage addToast={addToast} />;
      case "scene-editor": return <SceneEditorPage addToast={addToast} />;
      case "nav-preview": return <NavPreviewPage />;
      case "settings": return <SettingsPage addToast={addToast} />;
      case "design-system": return <DesignSystemPage />;
      default: return <DashboardHome onNavigate={setPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)" }}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[228px] z-50">
            <Sidebar current={page} onChange={(p) => { setPage(p); setMobileMenuOpen(false); }} collapsed={false} setCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar current={page} onChange={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header extra */}
        <div className="lg:hidden flex items-center px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center">
              <Navigation size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">AASTU Navigator</span>
          </div>
        </div>

        <Header page={page} onPageChange={setPage} />

        <main className={cn("flex-1 overflow-y-auto", page === "scene-editor" ? "overflow-hidden flex flex-col" : "")}>
          {renderPage()}
        </main>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
