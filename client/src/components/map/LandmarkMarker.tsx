import { useEffect, useRef, memo } from "react";
import type { Landmark, LandmarkCategory } from "@/types";
import { useGoogleMapInstance } from "./GoogleMapsContainer";

interface CategoryConfig {
  emoji: string;
  bg: string;
  border: string;
  label: string;
}

const CATEGORY_CONFIG: Record<LandmarkCategory, CategoryConfig> = {
  FOOD: {
    emoji: "🍴",
    bg: "#f59e0b",
    border: "#d97706",
    label: "Food & Drink",
  },
  EDUCATION: {
    emoji: "📚",
    bg: "#3b82f6",
    border: "#2563eb",
    label: "Education",
  },
  SPORTS: {
    emoji: "⚽",
    bg: "#22c55e",
    border: "#16a34a",
    label: "Sports",
  },
  ADMINISTRATION: {
    emoji: "🏛️",
    bg: "#6366f1",
    border: "#4f46e5",
    label: "Administration",
  },
  TRANSPORT: {
    emoji: "🚌",
    bg: "#0ea5e9",
    border: "#0284c7",
    label: "Transport",
  },
  EMERGENCY: {
    emoji: "🚨",
    bg: "#ef4444",
    border: "#dc2626",
    label: "Emergency",
  },
  RECREATION: {
    emoji: "🎭",
    bg: "#14b8a6",
    border: "#0d9488",
    label: "Recreation",
  },
  RELIGIOUS: {
    emoji: "⛪",
    bg: "#a855f7",
    border: "#9333ea",
    label: "Religious",
  },
  SERVICES: {
    emoji: "🔧",
    bg: "#64748b",
    border: "#475569",
    label: "Services",
  },
  CUSTOM: {
    emoji: "📍",
    bg: "#9ca3af",
    border: "#6b7280",
    label: "Landmark",
  },
};

interface LandmarkMarkerProps {
  landmark: Landmark;
  buildingCode?: string | null;
}

export const LandmarkMarker = memo(function LandmarkMarker({
  landmark,
  buildingCode: propBuildingCode,
}: LandmarkMarkerProps) {
  const map = useGoogleMapInstance();
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const displayName = landmark.building?.name ?? landmark.name;
  const buildingCode = propBuildingCode || landmark.building?.code;
  const lat = Number(landmark.latitude);
  const lng = Number(landmark.longitude);

  const cfg = CATEGORY_CONFIG[landmark.category] ?? CATEGORY_CONFIG.CUSTOM;
  const emoji = landmark.icon || cfg.emoji;

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      return;
    }

    const position = { lat, lng };

    const svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="${cfg.bg}" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="17" cy="16" r="11" fill="#FFFFFF" fill-opacity="0.9"/>
        <text x="17" y="21" font-size="13" text-anchor="middle" fill="#000000">${emoji}</text>
      </svg>
    `)}`;

    const marker = new google.maps.Marker({
      position,
      map,
      title: displayName,
      icon: {
        url: svgIcon,
        scaledSize: new google.maps.Size(34, 42),
        anchor: new google.maps.Point(17, 42),
      },
    });

    markerRef.current = marker;

    const popupHtml = `
      <div style="font-family:system-ui,sans-serif;padding:6px 4px;min-width:180px;max-width:230px;color:#0f172a;">
        ${
          landmark.image
            ? `<img src="${landmark.image}" alt="${displayName}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
            : ""
        }
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px;">
          <span style="font-size:20px;line-height:1;margin-top:2px;">${emoji}</span>
          <div style="flex:1;min-width:0;">
            <p style="font-weight:700;color:#0f172a;font-size:13px;margin:0;line-height:1.2;">
              ${displayName}
            </p>
            ${
              buildingCode
                ? `<p style="font-size:10px;color:#0284c7;font-weight:600;margin:2px 0 0 0;">${buildingCode}</p>`
                : ""
            }
            <span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 6px;border-radius:12px;margin-top:4px;background-color:${cfg.bg}22;color:${cfg.border};">
              ${cfg.label}
            </span>
          </div>
        </div>
        ${
          landmark.description
            ? `<p style="font-size:11px;color:#64748b;margin:6px 0;line-height:1.4;">${landmark.description}</p>`
            : ""
        }
        ${
          landmark.building
            ? `<a href="/dashboard/navigation-preview?buildingId=${landmark.building.id}" style="
                margin-top:8px;
                display:block;
                text-align:center;
                width:100%;
                border-radius:8px;
                background:#0284c7;
                color:#ffffff;
                font-size:11px;
                font-weight:600;
                padding:6px 10px;
                text-decoration:none;
                box-sizing:border-box;
              ">
                Navigate Here
              </a>`
            : ""
        }
      </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
      content: popupHtml,
      pixelOffset: new google.maps.Size(0, -38),
    });
    infoWindowRef.current = infoWindow;

    const clickListener = marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    return () => {
      google.maps.event.removeListener(clickListener);
      infoWindow.close();
      marker.setMap(null);
    };
  }, [
    map,
    lat,
    lng,
    displayName,
    buildingCode,
    landmark,
    cfg,
    emoji,
  ]);

  return null;
});

export { CATEGORY_CONFIG };
export type { CategoryConfig };