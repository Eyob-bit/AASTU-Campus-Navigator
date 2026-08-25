import { CheckCircle2, ArrowRight, X, Building, MapPin, Layers } from "lucide-react";
import { useAppStore } from "@/store";

export function ArrivalBottomSheet() {
  const { destinationTarget, enterBuilding, finishNavigation } = useAppStore();

  if (!destinationTarget) return null;

  const isOfficeTarget = destinationTarget.type === "OFFICE";
  const isStaffTarget = destinationTarget.type === "STAFF";
  const isIndoorTarget = isOfficeTarget || isStaffTarget;

  const floorNum = destinationTarget.floorNumber;
  const roomNum = destinationTarget.roomNumber;
  const officeName = destinationTarget.officeName;
  const staffName = destinationTarget.staffName;
  const buildingDisplayName = destinationTarget.buildingName || destinationTarget.name;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1100] p-3 sm:p-6 pb-20 sm:pb-6 flex justify-center pointer-events-none">
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-3xl border border-emerald-500/40 bg-[#0B132B]/98 p-5 text-slate-100 shadow-2xl backdrop-blur-2xl pointer-events-auto space-y-3.5 animate-slide-up">
        {/* Header badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>You are here</span>
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
            {buildingDisplayName}
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

          {/* Office/Staff-specific indoor instructions */}
          {isIndoorTarget && floorNum !== undefined && (
            <div className="mt-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>Indoor Destination</span>
              </div>
              {isStaffTarget && staffName && (
                <p className="text-xs text-slate-200">
                  <strong>{staffName}</strong>'s office is on{" "}
                  <strong className="text-cyan-300">Floor {floorNum}</strong>
                  {roomNum && (
                    <>, Room <strong className="text-cyan-300">{roomNum}</strong></>
                  )}.
                </p>
              )}
              {isOfficeTarget && officeName && (
                <p className="text-xs text-slate-200">
                  <strong>{officeName}</strong> is on{" "}
                  <strong className="text-cyan-300">Floor {floorNum}</strong>
                  {roomNum && (
                    <>, Room <strong className="text-cyan-300">{roomNum}</strong></>
                  )}.
                </p>
              )}
              <p className="text-[10px] text-slate-400 pt-0.5">
                Please go to Floor {floorNum} to continue.
              </p>
            </div>
          )}

          {!isIndoorTarget && (
            <p className="text-xs text-slate-400 pt-1">
              You are now at the entrance of your target destination.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          {isIndoorTarget ? (
            <button
              onClick={enterBuilding}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer active:scale-95"
            >
              <span>
                {floorNum !== undefined ? `Show Inside (Floor ${floorNum})` : "Show Inside"}
              </span>
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
