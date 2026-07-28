import { CheckCircle2, ArrowRight, X, Building, MapPin } from "lucide-react";
import { useAppStore } from "@/store";

export function ArrivalBottomSheet() {
  const { destinationTarget, enterBuilding, finishNavigation } = useAppStore();

  if (!destinationTarget) return null;

  const isIndoorTarget =
    destinationTarget.type === "OFFICE" || destinationTarget.type === "STAFF";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1100] p-3 sm:p-6 pb-20 sm:pb-6 flex justify-center pointer-events-none">
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-3xl border border-emerald-500/40 bg-[#0B132B]/98 p-5 text-slate-100 shadow-2xl backdrop-blur-2xl pointer-events-auto space-y-3.5 animate-slide-up">
        {/* Header badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>You have arrived</span>
          </div>
          <button
            onClick={finishNavigation}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Destination Info */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white tracking-wide">
            {destinationTarget.name}
          </h2>
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            {destinationTarget.buildingName ? (
              <>
                <Building className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>{destinationTarget.buildingName}</span>
                {destinationTarget.buildingCode && (
                  <span className="text-cyan-400 font-semibold">
                    ({destinationTarget.buildingCode})
                  </span>
                )}
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>AASTU Campus Location</span>
              </>
            )}
          </p>
          <p className="text-xs text-slate-400 pt-1">
            You are now at the entrance of your target destination.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          {isIndoorTarget ? (
            <button
              onClick={enterBuilding}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer active:scale-95"
            >
              <span>Enter Building</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={finishNavigation}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer active:scale-95"
            >
              <span>Finish Navigation</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
