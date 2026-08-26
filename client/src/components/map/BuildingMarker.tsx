import { useEffect, useRef, memo } from "react";
import type { Building } from "@/types";
import { useGoogleMapInstance } from "./GoogleMapsContainer";

interface BuildingMarkerProps {
  building: Building;
}

export const BuildingMarker = memo(function BuildingMarker({ building }: BuildingMarkerProps) {
  const map = useGoogleMapInstance();
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { name, code, entranceLatitude, entranceLongitude, floors } = building;
  const lat = Number(entranceLatitude);
  const lng = Number(entranceLongitude);

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      return;
    }

    const position = { lat, lng };

    // Building marker icon (cyan/blue pin with building glyph)
    const svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="#0B132B" stroke="#22D3EE" stroke-width="2"/>
        <circle cx="17" cy="16" r="11" fill="#06B6D4" fill-opacity="0.25"/>
        <text x="17" y="21" font-size="14" text-anchor="middle" fill="#FFFFFF">🏢</text>
      </svg>
    `)}`;

    const marker = new google.maps.Marker({
      position,
      map,
      title: `${name} (${code})`,
      icon: {
        url: svgIcon,
        scaledSize: new google.maps.Size(34, 42),
        anchor: new google.maps.Point(17, 42),
      },
    });

    markerRef.current = marker;

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
        <a
          href="/dashboard/navigation-preview?buildingId=${building.id}"
          style="display:block;text-align:center;width:100%;border-radius:8px;background:#0284c7;color:#ffffff;font-size:11px;font-weight:600;padding:6px 10px;text-decoration:none;box-sizing:border-box;"
        >
          Navigate Here
        </a>
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
  }, [map, lat, lng, name, code, floors, building.id]);

  return null;
});