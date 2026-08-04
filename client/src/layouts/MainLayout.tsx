import { Outlet, useLocation } from "react-router-dom";
import { AppHeader, AppBottomNav } from "@/components/common";
export function MainLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-[#080E1E] text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
      {!isHomePage && <AppHeader />}
      <main className={`flex-1 ${isHomePage ? "pb-0" : "pb-16"}`}>
        <Outlet />
      </main>
      <AppBottomNav />
    </div>
  );
}

