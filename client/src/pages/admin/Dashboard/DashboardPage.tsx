import { LayoutDashboard } from "lucide-react";
import { PlaceholderPage } from "../_shared/PlaceholderPage";

export function DashboardPage() {
  return (
    <PlaceholderPage
      icon={LayoutDashboard}
      title="Dashboard"
      description="Overview of buildings, floors, offices, staff, and recent activity. This module will be implemented in Sprint 2."
      color="blue"
    />
  );
}
