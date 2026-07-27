import { useEffect } from "react";
import { Building2, Layers, DoorOpen, Users, Map, Settings, Megaphone, ArrowRight, Activity, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Button, Skeleton } from "@/components/ui";
import { useStaff } from "@/hooks/useStaff";

export function DashboardPage() {
  const {
    staff,
    buildings,
    floorOptions,
    officeOptions,
    isLoading,
    error,
    fetchStaff,
  } = useStaff();

  useEffect(() => {
    fetchStaff().catch(() => {});
  }, [fetchStaff]);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-6 sm:py-8 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Activity className="text-blue-600" size={24} />
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time overview of the AASTU campus buildings, offices, navigation paths, and directory staff.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link to="/dashboard/scene-editor" className="w-full sm:w-auto">
            <Button className="w-full flex items-center justify-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2.5 rounded-lg font-semibold shadow-sm">
              <Map size={15} />
              Open Scene Editor
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 flex-1">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={() => fetchStaff()} className="text-xs text-red-600 font-semibold hover:underline">
              Retry
            </Button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Buildings Stats */}
          <Card className="p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Buildings</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
                  {isLoading ? <Skeleton className="h-9 w-14" /> : buildings.length}
                </h3>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-gray-400">Total structures</span>
              <Link to="/dashboard/buildings" className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          {/* Floors Stats */}
          <Card className="p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Floors</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
                  {isLoading ? <Skeleton className="h-9 w-14" /> : floorOptions.length}
                </h3>
              </div>
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-gray-400">Across all buildings</span>
              <Link to="/dashboard/floors" className="text-indigo-600 font-semibold hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          {/* Offices Stats */}
          <Card className="p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Offices</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
                  {isLoading ? <Skeleton className="h-9 w-14" /> : officeOptions.length}
                </h3>
              </div>
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <DoorOpen size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-gray-400">Rooms & service spots</span>
              <Link to="/dashboard/offices" className="text-emerald-600 font-semibold hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          {/* Staff Stats */}
          <Card className="p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Staff</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
                  {isLoading ? <Skeleton className="h-9 w-14" /> : staff.length}
                </h3>
              </div>
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-gray-400">Enriched directory profiles</span>
              <Link to="/dashboard/staff" className="text-amber-600 font-semibold hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </Card>
        </div>

        {/* Content Section: Quick Actions + Overviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Left + Middle Columns: Lists */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Buildings Summary List */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  Buildings Directory
                </h3>
                <span className="text-xs text-gray-400">{buildings.length} total</span>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : buildings.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No buildings found. Add one in the Buildings panel.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {buildings.slice(0, 5).map((b) => {
                    const floorsCount = floorOptions.filter((f) => f.buildingId === b.id).length;
                    const officesCount = officeOptions.filter((o) => o.buildingId === b.id).length;
                    return (
                      <div key={b.id} className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-lg transition-colors gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{b.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Code: {b.code}</p>
                        </div>
                        <div className="flex gap-2 sm:gap-4 text-[10px] sm:text-xs font-medium text-gray-500 flex-shrink-0">
                          <span className="bg-gray-100 px-2 sm:px-2.5 py-1 rounded-full">{floorsCount} floors</span>
                          <span className="bg-blue-50 text-blue-700 px-2 sm:px-2.5 py-1 rounded-full">{officesCount} offices</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Recent Staff Members */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-amber-600" />
                  Staff Members (Recent)
                </h3>
                <span className="text-xs text-gray-400">{staff.length} total</span>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : staff.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No staff members found. Add profiles in the Staff panel.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {staff.slice(0, 4).map((s) => (
                    <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{s.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{s.position || "No Title Specified"}</p>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                          {s.buildingName} • Floor {s.floorNumber} • {s.officeName}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-gray-400 font-mono flex-wrap">
                        {s.email && <span className="truncate max-w-[150px] sm:max-w-none">{s.email}</span>}
                        {s.email && s.phone && <span className="sm:hidden text-gray-300">•</span>}
                        {s.phone && <span>{s.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Quick Links & Help */}
          <div className="space-y-8">
            {/* Quick Management Panel */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4 border-b border-gray-50 pb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <Link to="/dashboard/buildings" className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-blue-50/40 hover:border-blue-200 transition-all text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-2.5">
                    <Building2 size={16} className="text-blue-500" />
                    Manage Buildings
                  </span>
                  <Plus size={14} className="text-gray-400" />
                </Link>

                <Link to="/dashboard/floors" className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-indigo-50/40 hover:border-indigo-200 transition-all text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-2.5">
                    <Layers size={16} className="text-indigo-500" />
                    Manage Floors
                  </span>
                  <Plus size={14} className="text-gray-400" />
                </Link>

                <Link to="/dashboard/offices" className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-emerald-50/40 hover:border-emerald-200 transition-all text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-2.5">
                    <DoorOpen size={16} className="text-emerald-500" />
                    Manage Offices
                  </span>
                  <Plus size={14} className="text-gray-400" />
                </Link>

                <Link to="/dashboard/staff" className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-amber-50/40 hover:border-amber-200 transition-all text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-2.5">
                    <Users size={16} className="text-amber-500" />
                    Manage Staff
                  </span>
                  <Plus size={14} className="text-gray-400" />
                </Link>

                <Link to="/dashboard/announcements" className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-purple-50/40 hover:border-purple-200 transition-all text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-2.5">
                    <Megaphone size={16} className="text-purple-500" />
                    Announcements
                  </span>
                  <Plus size={14} className="text-gray-400" />
                </Link>

                <Link to="/dashboard/settings" className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-2.5">
                    <Settings size={16} className="text-gray-500" />
                    Global Settings
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
              </div>
            </Card>

            {/* Editor Shortcuts */}
            <Card className="p-6 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white relative overflow-hidden rounded-2xl shadow-sm border-0">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                <Map size={180} />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-2 text-indigo-200">
                Interactive Map Editor
              </h3>
              <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                Enrich the 360° panorama views by placing interactive arrows, labeling campus offices, and adding informative points of interest.
              </p>
              <Link to="/dashboard/scene-editor">
                <Button className="w-full bg-white hover:bg-indigo-50 text-indigo-950 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow cursor-pointer">
                  Go to Scene Editor
                </Button>
              </Link>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
