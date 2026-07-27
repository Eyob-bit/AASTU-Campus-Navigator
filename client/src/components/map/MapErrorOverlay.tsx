import { AlertTriangle, RefreshCw } from "lucide-react";

interface MapErrorOverlayProps {
  message: string;
  onRetry: () => void;
}

export function MapErrorOverlay({ message, onRetry }: MapErrorOverlayProps) {
  return (
    <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/40 bg-[#0B132B]/95 p-6 shadow-2xl max-w-sm text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100">Failed to Load Map Data</h4>
          <p className="text-xs text-slate-400 mt-1">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-transform active:scale-95 hover:opacity-90 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    </div>
  );
}
