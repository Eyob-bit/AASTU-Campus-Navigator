import { useEffect, useRef, memo } from "react";
import type { Landmark, LandmarkCategory } from "@/types";
import { useAppStore } from "@/store";
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
  const destinationTarget = useAppStore((s) => s.destinationTarget);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const glowCircleRef = useRef<google.maps.Circle | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const displayName = landmark.building?.name ?? landmark.name;
  const buildingCode = propBuildingCode || landmark.building?.code;
  const lat = Number(landmark.latitude);
  const lng = Number(landmark.longitude);

  const isDestination = Boolean(
    destinationTarget && (
      destinationTarget.id === landmark.id ||
      destinationTarget.buildingId === landmark.buildingId ||
      destinationTarget.buildingId === landmark.building?.id ||
      (Math.abs(destinationTarget.latitude - lat) < 0.0001 && Math.abs(destinationTarget.longitude - lng) < 0.0001)
    )
  );

  const cfg = CATEGORY_CONFIG[landmark.category] ?? CATEGORY_CONFIG.CUSTOM;
  const emoji = landmark.icon || cfg.emoji;

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      return;
    }

    const position = { lat, lng };

    // Calculate dynamic badge dimensions for scaled SVG pin + name label
    const displayText = isDestination ? `🎯 ${displayName}` : displayName;
    const safeName = displayText.replace(/["'<>]/g, "");
    const charCount = Math.min(safeName.length, 24);
    const pillWidth = Math.max(charCount * 5.5 + 14, 44);
    const svgWidth = Math.max(pillWidth + 14, 48);
    const svgHeight = isDestination ? 58 : 48;
    const pinX = (svgWidth - 26) / 2;
    const pillX = (svgWidth - pillWidth) / 2;

    const svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${
          isDestination
            ? `
            <!-- Animated Glowing Halo Rings -->
            <g transform="translate(${pinX + 13}, 17)">
              <circle cx="0" cy="0" r="14" fill="${cfg.bg}" fill-opacity="0.5">
                <animate attributeName="r" values="14;28;14" dur="1.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.05;0.8" dur="1.6s" repeatCount="indefinite"/>
              </circle>
              <circle cx="0" cy="0" r="10" fill="${cfg.border}" fill-opacity="0.75">
                <animate attributeName="r" values="10;20;10" dur="1.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.6s" repeatCount="indefinite"/>
              </circle>
            </g>
            `
            : ""
        }
        <g transform="translate(${pinX}, 0) scale(0.7647)">
          <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="${cfg.bg}" stroke="${isDestination ? "#FFFFFF" : "#FFFFFF"}" stroke-width="${isDestination ? 3 : 2}"/>
          <circle cx="17" cy="16" r="11" fill="#FFFFFF" fill-opacity="0.95"/>
          <text x="17" y="21" font-size="13" text-anchor="middle" fill="#000000">${emoji}</text>
        </g>
        <rect x="${pillX}" y="${isDestination ? 34 : 31}" width="${pillWidth}" height="16" rx="8" fill="${isDestination ? "#0369A1" : "#0B132B"}" fill-opacity="0.95" stroke="${isDestination ? "#38BDF8" : cfg.bg}" stroke-width="${isDestination ? 1.8 : 1.2}"/>
        <text x="${svgWidth / 2}" y="${isDestination ? 45.5 : 42}" font-size="9" font-weight="${isDestination ? 700 : 600}" font-family="system-ui, sans-serif" text-anchor="middle" fill="#FFFFFF">${safeName}</text>
      </svg>
    `)}`;

    const marker = new google.maps.Marker({
      position,
      map,
      title: displayName,
      zIndex: isDestination ? 1000 : 10,
      icon: {
        url: svgIcon,
        scaledSize: new google.maps.Size(svgWidth, svgHeight),
        anchor: new google.maps.Point(svgWidth / 2, isDestination ? 38 : 32),
      },
    });

    markerRef.current = marker;

    // Glowing ground circle for active destination
    if (isDestination) {
      const glowCircle = new google.maps.Circle({
        map,
        center: position,
        radius: 22,
        fillColor: cfg.bg,
        fillOpacity: 0.22,
        strokeColor: cfg.border,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: false,
        zIndex: 5,
      });
      glowCircleRef.current = glowCircle;
    }

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
            ? `<button
                id="landmark-nav-btn-${landmark.id}"
                style="
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
                  border:none;
                  cursor:pointer;
                  box-sizing:border-box;
                "
              >
                Navigate Here
              </button>`
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

    // Wire up the "Navigate Here" button inside the InfoWindow after it opens
    const domReadyListener = infoWindow.addListener("domready", () => {
      const btn = document.getElementById(`landmark-nav-btn-${landmark.id}`);
      if (btn) {
        btn.addEventListener("click", () => {
          infoWindow.close();
          window.dispatchEvent(
            new CustomEvent("aastu_navigate_landmark", {
              detail: {
                id: landmark.id,
                name: landmark.building?.name ?? landmark.name,
                category: landmark.category,
                latitude: landmark.latitude,
                longitude: landmark.longitude,
                buildingId: landmark.buildingId,
                buildingName: landmark.building?.name,
                buildingCode: landmark.building?.code,
                roadNodeId: landmark.roadNodeId ?? landmark.building?.entranceRoadNodeId ?? null,
              },
            })
          );
        });
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(domReadyListener);
      infoWindow.close();
      marker.setMap(null);
      if (glowCircleRef.current) {
        glowCircleRef.current.setMap(null);
        glowCircleRef.current = null;
      }
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
    isDestination,
  ]);

  return null;
});

export { CATEGORY_CONFIG };
export type { CategoryConfig };