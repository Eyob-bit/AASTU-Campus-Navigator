import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/common/AppHeader";

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
