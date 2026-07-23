import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
        <AdminHeader onLogout={handleLogout} onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
