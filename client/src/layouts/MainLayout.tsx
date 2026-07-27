import { Outlet } from "react-router-dom";
import { AppBottomNav } from "@/components/common/AppBottomNav";

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080E1E] text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <AppBottomNav />
    </div>
  );
}
