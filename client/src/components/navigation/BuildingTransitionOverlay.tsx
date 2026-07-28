import { useEffect } from "react";
import { Loader2, Sparkles, Building2 } from "lucide-react";
import { useAppStore } from "@/store";

export function BuildingTransitionOverlay() {
  const { destinationTarget, setNavStep } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setNavStep("INDOOR_GUIDANCE");
    }, 1400);

    return () => clearTimeout(timer);
  }, [setNavStep]);

  if (!destinationTarget) return null;

  return (
    <div className="fixed inset-0 z-[1060] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-cyan-500/40 bg-[#0B132B] p-6 text-center text-slate-100 shadow-2xl space-y-4">
        {/* Animated icon */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
          <Building2 className="h-8 w-8 text-white" />
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            GPS Navigation Complete
          </p>
          <h3 className="font-bold text-base text-white">
            Switching to Indoor Navigation...
          </h3>
          <p className="text-xs text-slate-400">
            Loading Floor {destinationTarget.floorNumber ?? 1} (
            {destinationTarget.buildingCode ?? "Building"})
          </p>
        </div>

        {/* Spinner */}
        <div className="pt-2 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      </div>
    </div>
  );
}
