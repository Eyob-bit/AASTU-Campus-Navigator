import { useState } from "react";
import { ChevronDown, ChevronUp, Map } from "lucide-react";
import { CATEGORY_CONFIG } from "./LandmarkMarker";
import type { LandmarkCategory } from "@/types";

const VISIBLE_CATEGORIES = Object.entries(CATEGORY_CONFIG) as [
  LandmarkCategory,
  (typeof CATEGORY_CONFIG)[LandmarkCategory]
][];

export function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute bottom-20 sm:bottom-6 right-3 sm:right-4 z-[999] max-w-[180px]"
      style={{ pointerEvents: "auto" }}
    >
      {open && (
        <div
          className="mb-2 rounded-xl border border-slate-700/60 bg-[#0B132B]/90 p-3 backdrop-blur-md shadow-2xl"
        >
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Map Legend
          </p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 pb-1.5 border-b border-slate-700/60 mb-1">
              <span className="w-5 h-2 rounded bg-yellow-400 border border-yellow-300 shrink-0 shadow-sm" />
              <span className="text-[11px] font-semibold text-yellow-300">AASTU Boundary</span>
            </li>
            {VISIBLE_CATEGORIES.map(([cat, cfg]) => (
              <li key={cat} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0"
                  style={{ background: cfg.bg }}
                >
                  {cfg.emoji}
                </span>
                <span className="text-[11px] text-slate-300">{cfg.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-[#0B132B]/90 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-md shadow-lg hover:bg-cyan-500/10 transition-all"
      >
        <Map size={13} className="text-cyan-400" />
        <span>Legend</span>
        {open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
    </div>
  );
}
