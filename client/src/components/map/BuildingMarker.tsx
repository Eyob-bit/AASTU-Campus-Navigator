import { useEffect, useRef, memo } from "react";
import type { Building } from "@/types";
import { useAppStore } from "@/store";
import { useGoogleMapInstance } from "./GoogleMapsContainer";

interface BuildingMarkerProps {
  building: Building;
}

export const BuildingMarker = memo(function BuildingMarker({ building }: BuildingMarkerProps) {
  const map = useGoogleMapInstance();
  const destinationTarget = useAppStore((s) => s.destinationTarget);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const glowCircleRef = useRef<google.maps.Circle | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { name, code, entranceLatitude, entranceLongitude, floors } = building;
  const lat = Number(entranceLatitude);
  const lng = Number(entranceLongitude);

  const isDestination = Boolean(
    destinationTarget && (
      destinationTarget.buildingId === building.id ||
      destinationTarget.id === building.id ||
      (Math.abs(destinationTarget.latitude - lat) < 0.0001 && Math.abs(destinationTarget.longitude - lng) < 0.0001)
    )
  );

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      return;
    }

    const position = { lat, lng };

    // Building marker icon (cyan/blue pin + name pill label)
    const displayText = isDestination
      ? `🎯 ${code ? `${name} (${code})` : name}`
      : (code ? `${name} (${code})` : name);
    const safeText = displayText.replace(/["'<>]/g, "");
    const charCount = Math.min(safeText.length, 26);
    const pillWidth = Math.max(charCount * 5.5 + 16, 48);
    const svgWidth = Math.max(pillWidth + 14, 52);
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
              <circle cx="0" cy="0" r="14" fill="#06B6D4" fill-opacity="0.5">
                <animate attributeName="r" values="14;28;14" dur="1.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.05;0.8" dur="1.6s" repeatCount="indefinite"/>
              </circle>
              <circle cx="0" cy="0" r="10" fill="#22D3EE" fill-opacity="0.75">
                <animate attributeName="r" values="10;20;10" dur="1.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.6s" repeatCount="indefinite"/>
              </circle>
            </g>
            `
            : ""
        }
        <g transform="translate(${pinX}, 0) scale(0.7647)">
          <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="${isDestination ? "#0284C7" : "#0B132B"}" stroke="${isDestination ? "#38BDF8" : "#22D3EE"}" stroke-width="${isDestination ? 3 : 2}"/>
          <circle cx="17" cy="16" r="11" fill="${isDestination ? "#38BDF8" : "#06B6D4"}" fill-opacity="${isDestination ? 0.45 : 0.25}"/>
          <text x="17" y="21" font-size="14" text-anchor="middle" fill="#FFFFFF">🏢</text>
        </g>
        <rect x="${pillX}" y="${isDestination ? 34 : 31}" width="${pillWidth}" height="16" rx="8" fill="${isDestination ? "#0369A1" : "#0B132B"}" fill-opacity="0.96" stroke="${isDestination ? "#38BDF8" : "#22D3EE"}" stroke-width="${isDestination ? 1.8 : 1.2}"/>
        <text x="${svgWidth / 2}" y="${isDestination ? 45.5 : 42.5}" font-size="9" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle" fill="${isDestination ? "#FFFFFF" : "#22D3EE"}">${safeText}</text>
      </svg>
    `)}`;

    const marker = new google.maps.Marker({
      position,
      map,
      title: `${name} (${code})`,
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
        fillColor: "#06B6D4",
        fillOpacity: 0.22,
        strokeColor: "#22D3EE",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: false,
        zIndex: 5,
      });
      glowCircleRef.current = glowCircle;
    }

    const popupHtml = `
      <div style="font-family:system-ui,sans-serif;padding:6px 4px;min-width:180px;max-width:220px;color:#0f172a;">
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;">
          <div style="width:32px;height:32px;border-radius:8px;background:#e0f2fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-size:16px;">🏢</span>
          </div>
          <div style="flex:1;min-width:0;">
            <p style="font-weight:700;font-size:13px;color:#0f172a;margin:0;line-height:1.2;">${name}</p>
            <span style="font-size:10px;font-weight:700;color:#0284c7;text-transform:uppercase;letter-spacing:0.05em;">${code}</span>
          </div>
        </div>
        ${
          floors && Array.isArray(floors)
            ? `<div style="font-size:11px;color:#64748b;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                <span>📚 ${floors.length} ${floors.length === 1 ? "Floor" : "Floors"}</span>
              </div>`
            : ""
        }
        <button
          id="building-nav-btn-${building.id}"
          style="display:block;text-align:center;width:100%;border-radius:8px;background:#0284c7;color:#ffffff;font-size:11px;font-weight:600;padding:6px 10px;border:none;cursor:pointer;box-sizing:border-box;"
        >
          Navigate Here
        </button>
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

    const domReadyListener = infoWindow.addListener("domready", () => {
      const btn = document.getElementById(`building-nav-btn-${building.id}`);
      if (btn) {
        btn.addEventListener("click", () => {
          infoWindow.close();
          window.dispatchEvent(
            new CustomEvent("aastu_navigate_landmark", {
              detail: {
                id: building.id,
                name: building.name,
                category: "ADMINISTRATION",
                latitude: lat,
                longitude: lng,
                buildingId: building.id,
                buildingName: building.name,
                buildingCode: building.code,
                roadNodeId: building.entranceRoadNodeId ?? null,
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
  }, [map, lat, lng, name, code, floors, building.id, building.name, building.entranceRoadNodeId, isDestination]);

  return null;
});