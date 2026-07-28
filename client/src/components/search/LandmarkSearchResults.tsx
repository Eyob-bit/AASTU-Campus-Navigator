import { useNavigate } from "react-router-dom";
import { CATEGORY_CONFIG } from "@/components/map/LandmarkMarker";
import type { Landmark } from "@/types";

interface LandmarkSearchResultsProps {
  landmarks: Landmark[];
}

export function LandmarkSearchResults({ landmarks }: LandmarkSearchResultsProps) {
  const navigate = useNavigate();

  if (landmarks.length === 0) return null;

  return (
    <ul className="space-y-3">
      {landmarks.map((landmark) => {
        const cfg = CATEGORY_CONFIG[landmark.category] ?? CATEGORY_CONFIG.CUSTOM;
        return (
          <li
            key={landmark.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: cfg.bg + "22" }}
                >
                  {landmark.icon || cfg.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{landmark.name}</p>
                  <p className="text-sm text-slate-500">
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
              <button
                onClick={() => navigate(`/?landmark=${landmark.id}`)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 shrink-0"
              >
                View on Map
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
