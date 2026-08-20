import { useEffect, useRef } from "react";
import { Marker, Popup } from "maplibre-gl";
import type { Landmark, LandmarkCategory } from "@/types";
import { useMapInstance } from "./MapLibreContainer";

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

interface LandmarkMarkerProps {
  landmark: Landmark;
  buildingCode?: string | null;
}

export function LandmarkMarker({ landmark, buildingCode: propBuildingCode }: LandmarkMarkerProps) {
  const map = useMapInstance();
  const markerRef = useRef<Marker | null>(null);

  const displayName = landmark.building?.name ?? landmark.name;
  const buildingCode = propBuildingCode || landmark.building?.code;
  const lat = Number(landmark.latitude);
  const lng = Number(landmark.longitude);

  useEffect(() => {
    if (!map || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const cfg = CATEGORY_CONFIG[landmark.category] ?? CATEGORY_CONFIG.CUSTOM;
    const emoji = landmark.icon || cfg.emoji;
    const label = displayName.length > 20 ? displayName.slice(0, 18) + "…" : displayName;

    const el = document.createElement("div");
    el.style.cursor = "pointer";
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
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
    `;

    const popupHtml = `
      <div style="padding:4px;min-width:180px;max-width:230px;">
        ${
          landmark.image
            ? `<img src="${landmark.image}" alt="${displayName}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
            : ""
        }
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px;">
          <span style="font-size:20px;line-height:1;margin-top:2px;">${landmark.icon || cfg.emoji}</span>
          <div style="flex:1;min-width:0;">
            <p style="font-weight:600;color:#f8fafc;font-size:13px;margin:0;line-height:1.2;">${displayName}</p>
            ${
              landmark.building
                ? `<p style="font-size:10px;color:#22d3ee;font-weight:500;margin:2px 0 0 0;">${landmark.building.code}</p>`
                : ""
            }
            <span style="display:inline-block;font-size:10px;font-weight:500;padding:2px 6px;border-radius:12px;margin-top:4px;background-color:${cfg.bg}33;color:${cfg.border};">
              ${cfg.label}
            </span>
          </div>
        </div>
        ${
          landmark.description
            ? `<p style="font-size:11px;color:#94a3b8;margin:6px 0;line-height:1.4;">${landmark.description}</p>`
            : ""
        }
        ${
          landmark.building
            ? `<a href="/navigation?buildingId=${landmark.building.id}" style="margin-top:8px;display:block;width:100%;text-align:center;border-radius:8px;background:linear-gradient(to right, #06b6d4, #2563eb);color:#ffffff;font-size:11px;font-weight:600;padding:6px 12px;text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,0.3);">
                Navigate Here
              </a>`
            : ""
        }
      </div>
    `;

    const popup = new Popup({
      offset: [0, -32],
      closeButton: true,
      closeOnClick: false,
    }).setHTML(popupHtml);

    const marker = new Marker({
      element: el,
      anchor: "bottom",
      rotationAlignment: "viewport",
      pitchAlignment: "viewport",
    })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, lat, lng, displayName, buildingCode, landmark]);

  return null;
}

export { CATEGORY_CONFIG };
export type { CategoryConfig };
