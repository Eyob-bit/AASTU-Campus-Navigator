import { Compass, Footprints, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

export function IndoorGuidanceCard() {
  const navigate = useNavigate();
  const { destinationTarget, startIndoorNavigation, finishNavigation } = useAppStore();

  if (!destinationTarget) return null;

  const handleStartIndoor = () => {
    startIndoorNavigation();
    const sceneId = destinationTarget.entrySceneId;
    if (sceneId) {
      navigate(`/panorama/${sceneId}`);
    } else {
      navigate("/panorama");
    }
  };

  const floorNum = destinationTarget.floorNumber ?? 1;
  const roomNum = destinationTarget.roomNumber ?? "Entrance";

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border border-cyan-500/40 bg-[#0B132B] p-5 sm:p-6 text-slate-100 shadow-2xl space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                INDOOR GUIDANCE
              </span>
              <h3 className="font-bold text-sm text-white">
                {destinationTarget.name}
              </h3>
            </div>
          </div>
          <button
            onClick={finishNavigation}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Location Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-700/60 bg-[#131F3F]/80 p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide block">FLOOR</span>
            <strong className="text-base font-bold text-white">
              {floorNum === 0 ? "Floor 0 (Ground)" : `Floor ${floorNum}`}
            </strong>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-[#131F3F]/80 p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide block">ROOM / OFFICE</span>
            <strong className="text-base font-bold text-cyan-400">Room {roomNum}</strong>
          </div>
        </div>

        {/* Step Instructions */}
        <div className="space-y-2.5 rounded-2xl border border-slate-700/50 bg-[#131F3F]/50 p-4 text-xs">
          <p className="font-semibold text-slate-200 uppercase tracking-wider text-[10px]">
            Instructions:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold mt-0.5 shrink-0">1</span>
              <span>
                Go to <strong>Floor {floorNum}</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold mt-0.5 shrink-0">2</span>
              <span>Follow the guided blue arrows in 360° panorama view.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold mt-0.5 shrink-0">3</span>
              <span>Look for <strong>Room {roomNum}</strong> at your destination.</span>
            </li>
          </ul>
        </div>

        {/* Start Indoor Button */}
        <button
          onClick={handleStartIndoor}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer active:scale-95"
        >
          <Footprints className="h-4 w-4" />
          <span>Start Indoor Navigation</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
