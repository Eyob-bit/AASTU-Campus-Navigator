import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Landmark, LandmarkCategory } from "@/types";

// ── Category configuration ─────────────────────────────────────────────────

interface CategoryConfig {
  emoji: string;
  bg: string;
  border: string;
  label: string;
}

const CATEGORY_CONFIG: Record<LandmarkCategory, CategoryConfig> = {
  FOOD:           { emoji: "🍴", bg: "#f59e0b", border: "#d97706", label: "Food & Drink"   },
  EDUCATION:      { emoji: "📚", bg: "#3b82f6", border: "#2563eb", label: "Education"      },
  SPORTS:         { emoji: "⚽", bg: "#22c55e", border: "#16a34a", label: "Sports"         },
  ADMINISTRATION: { emoji: "🏛️", bg: "#6366f1", border: "#4f46e5", label: "Administration" },
  TRANSPORT:      { emoji: "🚌", bg: "#0ea5e9", border: "#0284c7", label: "Transport"      },
  EMERGENCY:      { emoji: "🚨", bg: "#ef4444", border: "#dc2626", label: "Emergency"      },
  RECREATION:     { emoji: "🎭", bg: "#14b8a6", border: "#0d9488", label: "Recreation"     },
  RELIGIOUS:      { emoji: "⛪", bg: "#a855f7", border: "#9333ea", label: "Religious"      },
  SERVICES:       { emoji: "🔧", bg: "#64748b", border: "#475569", label: "Services"       },
  CUSTOM:         { emoji: "📍", bg: "#9ca3af", border: "#6b7280", label: "Landmark"       },
};

function makeLandmarkIcon(
  displayName: string,
  category: LandmarkCategory,
  customEmoji?: string | null,
  buildingCode?: string | null
): L.DivIcon {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.CUSTOM;
  const emoji = customEmoji || cfg.emoji;
  // Truncate name for label
  const label = displayName.length > 20 ? displayName.slice(0, 18) + "…" : displayName;

  return L.divIcon({
    className: "",
    iconAnchor: [16, 58],
    popupAnchor: [0, -60],
    html: `
      <div class="map-marker-unrotate" style="
        display:flex;flex-direction:column;align-items:center;
        pointer-events:none;
      ">
        <div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          background:${cfg.bg};border:2px solid ${cfg.border};
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);font-size:13px;line-height:1;">${emoji}</span>
        </div>
        <div style="
          margin-top:2px;
          background:rgba(11,19,43,0.92);
          border:1px solid ${cfg.border}77;
          border-radius:5px;
          padding:2px 6px;
          white-space:nowrap;
          max-width:140px;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          backdrop-filter:blur(4px);
          text-align:center;
        ">
          <span style="
            color:#f8fafc;font-size:8.5px;font-weight:700;
            letter-spacing:0.01em;
            display:block;overflow:hidden;text-overflow:ellipsis;
          ">${label}</span>
          ${
            buildingCode
              ? `<span style="
                  color:#22d3ee;font-size:7.5px;font-weight:700;
                  letter-spacing:0.06em;text-transform:uppercase;
                  display:block;margin-top:1px;
                ">${buildingCode}</span>`
              : ""
          }
        </div>
      </div>
    `,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LandmarkMarkerProps {
  landmark: Landmark;
  buildingCode?: string | null;
}

export function LandmarkMarker({ landmark, buildingCode: propBuildingCode }: LandmarkMarkerProps) {
  // If this landmark is linked to a building, use the building's name as the
  // authoritative display label — so renaming the building auto-updates the map.
  const displayName = landmark.building?.name ?? landmark.name;
  const buildingCode = propBuildingCode || landmark.building?.code;

  const icon = makeLandmarkIcon(displayName, landmark.category, landmark.icon, buildingCode);
  const cfg  = CATEGORY_CONFIG[landmark.category] ?? CATEGORY_CONFIG.CUSTOM;

  return (
    <Marker
      position={[landmark.latitude, landmark.longitude]}
      icon={icon}
    >
      <Popup className="campus-popup" maxWidth={260} minWidth={200}>
        <div className="p-1">
          {landmark.image && (
            <img
              src={landmark.image}
              alt={displayName}
              className="w-full h-28 object-cover rounded-lg mb-2"
            />
          )}
          <div className="flex items-start gap-2 mb-1">
            <span className="text-xl leading-none mt-0.5">{landmark.icon || cfg.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight">{displayName}</p>
              {landmark.building && (
                <p className="text-[10px] text-cyan-600 font-medium">{landmark.building.code}</p>
              )}
              <span
                className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5"
                style={{ backgroundColor: cfg.bg + "22", color: cfg.border }}
              >
                {cfg.label}
              </span>
            </div>
          </div>
          {landmark.description && (
            <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-3">
              {landmark.description}
            </p>
          )}
          {landmark.building && (
            <a
              href={`/navigation?buildingId=${landmark.building.id}`}
              className="mt-2 block w-full text-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold py-1.5 px-3 shadow-sm hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              Navigate Here
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export { CATEGORY_CONFIG };
export type { CategoryConfig };
