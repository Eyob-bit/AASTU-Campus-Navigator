import { CheckCircle2, Clock, Phone, Mail, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

export function DestinationReachedModal() {
  const navigate = useNavigate();
  const { destinationTarget, finishNavigation } = useAppStore();

  if (!destinationTarget) return null;

  const handleFinish = () => {
    finishNavigation();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border border-emerald-500/50 bg-[#0B132B] p-5 sm:p-6 text-slate-100 shadow-2xl space-y-4 text-center">
        {/* Celebration Badge */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/30">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
            🎉 DESTINATION REACHED
          </span>
          <h2 className="text-xl font-extrabold text-white">
            {destinationTarget.name}
          </h2>
          <p className="text-xs text-cyan-400 font-semibold">
            {destinationTarget.roomNumber ? `Room ${destinationTarget.roomNumber}` : ""}
            {destinationTarget.buildingName ? ` · ${destinationTarget.buildingName}` : ""}
          </p>
        </div>

        {/* Contact & Info Box */}
        <div className="rounded-2xl border border-slate-700/60 bg-[#131F3F]/70 p-4 space-y-2.5 text-left text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Office Hours: <strong className="text-white">8:30 AM – 5:30 PM</strong></span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-200">
            <Phone className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Phone: <strong className="text-white">{destinationTarget.staffPhone || "+251 11 888 0000"}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-200">
            <Mail className="h-4 w-4 text-blue-400 shrink-0 text-truncate" />
            <span>Email: <strong className="text-white">{destinationTarget.staffEmail || "contact@aastu.edu.et"}</strong></span>
          </div>
        </div>

        {/* Finish button */}
        <button
          onClick={handleFinish}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer active:scale-95"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Finish Navigation</span>
        </button>
      </div>
    </div>
  );
}
