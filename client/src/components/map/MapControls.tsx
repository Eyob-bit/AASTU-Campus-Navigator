import type { TileMode } from "./mapConfig";

interface MapControlsProps {
  tileMode: TileMode;
  onToggleTile: () => void;
  onCenterLocation: () => void;
}

export function MapControls({
  tileMode,
  onToggleTile,
  onCenterLocation,
}: MapControlsProps) {
  return (
    <div
      className="absolute bottom-24 right-3 sm:right-4 z-[1000] flex flex-col gap-2 pointer-events-auto select-none"
      style={{ zIndex: 1000 }}
    >
      {/* Satellite / Street toggle */}
      <button
        onClick={onToggleTile}
        className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xl backdrop-blur-md active:scale-95 ${
          tileMode === "street"
            ? "bg-[#0B132B]/95 text-white border border-slate-700 hover:bg-slate-800 hover:border-cyan-400"
            : "bg-white/95 text-slate-900 border border-gray-300 hover:bg-gray-100 hover:border-blue-500"
        }`}
        title={tileMode === "street" ? "Switch to Satellite View" : "Switch to Street View"}
      >
        {tileMode === "street" ? (
          <>
            <span style={{ fontSize: 13 }}>🛰️</span><span>Satellite</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 13 }}>🗺️</span><span>Street</span>
          </>
        )}
      </button>

      {/* Center on my location */}
      <button
        onClick={onCenterLocation}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B132B]/95 text-cyan-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95"
        title="Center on My Location"
      >
        <span style={{ fontSize: 16 }}>🎯</span>
      </button>
    </div>
  );
}