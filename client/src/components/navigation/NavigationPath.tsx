import { useNavigate } from "react-router-dom";
import { Compass, Footprints, MapPin, Building2 } from "lucide-react";
import type { PathNode } from "@/types";
import { useNavigationPath } from "@/hooks";
import { useAppStore } from "@/store";

interface NavigationPathProps {
  officeId?: string | null;
}

export function NavigationPath({ officeId }: NavigationPathProps) {
  const navigate = useNavigate();
  const { selectedResult, startIndoorNavigation } = useAppStore();
  const resolvedOfficeId = officeId ?? selectedResult?.office.id ?? null;
  const { data, isLoading, error } = useNavigationPath(resolvedOfficeId);

  if (!resolvedOfficeId) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-[#0B132B]/80 p-8 text-center text-slate-400">
        Search for a destination first, then start navigation from the results.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-[#0B132B]/90 p-8 text-center text-slate-300">
        Generating indoor navigation path...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-red-400 text-sm">
        {error.message}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const handleStartPanorama = () => {
    startIndoorNavigation();
    navigate("/panorama");
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header Info Card */}
      <div className="rounded-3xl border border-cyan-500/30 bg-[#0B132B]/90 p-6 backdrop-blur-md shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
              INDOOR ROUTE SUMMARY
            </span>
            <h2 className="text-xl font-extrabold text-white">
              {data.office.name}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                {data.building.name} ({data.building.code}) · Floor {data.floor.floorNumber} · Room {data.office.roomNumber}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleStartPanorama}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer active:scale-95"
        >
          <Footprints className="h-4 w-4" />
          <span>Launch 360° Guided Panorama</span>
        </button>
      </div>

      {/* Step by Step Path List */}
      <div className="rounded-3xl border border-slate-800/90 bg-[#0B132B]/90 p-6 backdrop-blur-md space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Compass className="h-4 w-4 text-cyan-400" />
          <span>Step-by-Step Waypoints</span>
        </h3>

        <ol className="space-y-3">
          {data.path.map((step: PathNode, index: number) => (
            <li
              key={step.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-700/60 bg-[#131F3F]/70 p-4 transition-all hover:border-cyan-500/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-md shadow-cyan-500/20 shrink-0">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">{step.name}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{step.key}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
