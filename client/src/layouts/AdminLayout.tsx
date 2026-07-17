import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Navigation } from "lucide-react";
import { Sidebar, AdminHeader } from "@/components/layout";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function AdminLayout() {
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const { logout } = useAdminAuth();
  const navigate   = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className="flex h-screen bg-gray-50 overflow-hidden"
      style={{ fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)" }}
    >
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[228px] z-50">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onLogout={handleLogout}
        />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center px-4 py-3 bg-white border-b border-gray-100">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center">
              <Navigation size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">AASTU Navigator</span>
          </div>
        </div>

        <AdminHeader onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
