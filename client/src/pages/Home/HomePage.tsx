import { Link } from "react-router-dom";
import { PageContainer } from "@/components/common";
import { CampusMap } from "@/components/map";

export function HomePage() {
  return (
    <PageContainer
      title="AASTU Campus Navigator"
      description="Find offices, staff, and indoor routes across campus."
    >
      <div className="space-y-6">
        <CampusMap />
        <div className="flex flex-wrap gap-3">
          <Link
            to="/search"
            className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Search campus
          </Link>
          <Link
            to="/navigation"
            className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-300"
          >
            Start navigation
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
