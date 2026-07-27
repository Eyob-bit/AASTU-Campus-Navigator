import { Loader2 } from "lucide-react";

export function MapLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700/80 bg-[#0B132B]/90 p-6 shadow-2xl shadow-black/80">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-xs font-semibold text-slate-200 tracking-wide">
          Loading Campus Buildings...
        </p>
      </div>
    </div>
  );
}
