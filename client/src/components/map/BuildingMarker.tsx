import { useEffect, useRef } from "react";
import { Marker, Popup } from "maplibre-gl";
import type { Building } from "@/types";
import { useMapInstance } from "./MapLibreContainer";

interface BuildingMarkerProps {
  building: Building;
}

export function BuildingMarker({ building }: BuildingMarkerProps) {
  const map = useMapInstance();
  const markerRef = useRef<Marker | null>(null);

  const { name, code, entranceLatitude, entranceLongitude, floors } = building;
  const lat = Number(entranceLatitude);
  const lng = Number(entranceLongitude);

  useEffect(() => {
    if (!map || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    // Create marker container element
    const el = document.createElement("div");
    el.style.cursor = "pointer";
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="
          background:rgba(11,19,43,0.93);
          border:1px solid rgba(34,211,238,0.55);
          border-radius:6px;
          padding:2px 6px 2px 5px;
          display:flex;flex-direction:column;gap:0px;
          box-shadow:0 2px 10px rgba(0,0,0,0.5);
          backdrop-filter:blur(6px);
          white-space:nowrap;
          max-width:140px;
        ">
          <span style="
            color:#e2e8f0;font-size:9.5px;font-weight:700;
            line-height:1.25;letter-spacing:0.01em;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
          ">${name}</span>
          <span style="
            color:#22d3ee;font-size:7.5px;font-weight:600;
            letter-spacing:0.07em;text-transform:uppercase;
          ">${code}</span>
        </div>
        <div style="width:1.5px;height:4px;background:rgba(34,211,238,0.7);"></div>
        <div style="
          width:5px;height:5px;border-radius:50%;
          background:#22d3ee;box-shadow:0 0 4px #22d3ee;
        "></div>
      </div>
    `;

    const floorCount = floors && Array.isArray(floors) ? floors.length : null;

    const popupHtml = `
      <div style="padding:4px;min-width:180px;max-width:220px;">
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(51,65,85,0.5);">
          <div style="width:32px;height:32px;border-radius:8px;background:rgba(6,182,212,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-size:16px;">🏢</span>
          </div>
          <div style="flex:1;min-width:0;">
            <p style="font-weight:700;font-size:13px;color:#f8fafc;margin:0;line-height:1.2;">${name}</p>
            <span style="font-size:10px;font-weight:600;color:#22d3ee;text-transform:uppercase;letter-spacing:0.05em;">${code}</span>
          </div>
        </div>

        ${
          floorCount !== null
            ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                <span>📚 ${floorCount} ${floorCount === 1 ? "Floor" : "Floors"}</span>
              </div>`
            : ""
        }

        <a
          href="/navigation?buildingId=${building.id}"
          style="display:block;width:100%;text-align:center;border-radius:8px;background:linear-gradient(to right, #06b6d4, #2563eb);color:#ffffff;font-size:11px;font-weight:600;padding:6px 12px;text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,0.3);"
        >
          Navigate Here
        </a>
      </div>
    `;

    const popup = new Popup({
      offset: [0, -20],
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
  }, [map, lat, lng, name, code, floors, building.id]);

  return null;
}
