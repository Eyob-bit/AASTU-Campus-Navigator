import { useNavigate } from "react-router-dom";
import { CATEGORY_CONFIG } from "@/components/map/LandmarkMarker";
import { useAppStore } from "@/store";
import type { Landmark, DestinationTarget } from "@/types";

interface LandmarkSearchResultsProps {
  landmarks: Landmark[];
}

export function LandmarkSearchResults({ landmarks }: LandmarkSearchResultsProps) {
  const navigate = useNavigate();
  const { startOutdoorNavigation } = useAppStore();

  if (landmarks.length === 0) return null;

  const handleNavigateLandmark = (landmark: Landmark) => {
    const isBuilding = Boolean(landmark.building);

    const target: DestinationTarget = {
      id: landmark.id,
      type: isBuilding ? "BUILDING" : "LANDMARK",
      name: landmark.building?.name ?? landmark.name,
      subtitle: `${landmark.category} Landmark · AASTU Campus`,
      latitude: landmark.latitude,
      longitude: landmark.longitude,
      buildingId: landmark.buildingId ?? undefined,
      buildingName: landmark.building?.name,
      buildingCode: landmark.building?.code,
    };

    startOutdoorNavigation(target);
    navigate("/");
  };

  return (
    <ul className="space-y-3">
      {landmarks.map((landmark) => {
        const cfg = CATEGORY_CONFIG[landmark.category] ?? CATEGORY_CONFIG.CUSTOM;
        return (
          <li
            key={landmark.id}
            className="rounded-2xl border border-slate-700/60 bg-[#0B132B]/90 p-4 backdrop-blur-md shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border border-slate-700"
                  style={{ background: cfg.bg + "33" }}
                >
                  {landmark.icon || cfg.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{landmark.name}</p>
                  <p className="text-xs text-slate-400">
                    <span
                      className="font-medium"
                      style={{ color: cfg.border }}
                    >
                      {cfg.label}
                    </span>
                    {landmark.description && ` · ${landmark.description}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigateLandmark(landmark)}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  Navigate
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
