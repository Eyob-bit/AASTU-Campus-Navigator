import { Navigation2, X, Compass, MapPin, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store";
import { formatDistance, calculateETAInMinutes, calculateDistanceInMeters } from "@/utils/geo";

export function OutdoorNavOverlay() {
  const {
    destinationTarget,
    userLocation,
    triggerArrival,
    finishNavigation,
    setUserLocation,
  } = useAppStore();

  if (!destinationTarget) return null;

  const distance =
    userLocation && destinationTarget
      ? calculateDistanceInMeters(
          userLocation.lat,
          userLocation.lng,
          destinationTarget.latitude,
          destinationTarget.longitude
        )
      : 320; // Default demo distance if GPS permission pending

  const formattedDist = formatDistance(distance);
  const eta = calculateETAInMinutes(distance);

  const handleSimulateArrival = () => {
    // Move user location to destination entrance to trigger arrival
    setUserLocation({
      lat: destinationTarget.latitude,
      lng: destinationTarget.longitude,
    });
    triggerArrival();
  };

  return (
    <div className="absolute top-16 sm:top-20 inset-x-3 sm:inset-x-auto sm:left-4 z-[1001] sm:max-w-md w-auto">
      <div className="rounded-2xl border border-cyan-500/40 bg-[#0B132B]/95 p-4 text-slate-100 shadow-2xl backdrop-blur-xl space-y-3 animate-slide-down">
        {/* Top title bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Navigation2 className="h-4 w-4 animate-pulse" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                OUTDOOR NAVIGATION
              </span>
              <h3 className="font-bold text-sm text-white truncate">
                {destinationTarget.name}
              </h3>
            </div>
          </div>
          <button
            onClick={finishNavigation}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shrink-0"
            title="Cancel Navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Distance & ETA statistics cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/60 bg-[#131F3F]/80 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">DISTANCE</span>
              <strong className="text-sm font-bold text-white">{formattedDist}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/60 bg-[#131F3F]/80 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">EST. TIME</span>
              <strong className="text-sm font-bold text-white">{eta} min{eta > 1 ? "s" : ""}</strong>
            </div>
          </div>
        </div>

        {/* Action button bar */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={handleSimulateArrival}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Simulate Arrival</span>
          </button>
        </div>
      </div>
    </div>
  );
}
