import { useEffect, useRef } from "react";
import { Marker } from "maplibre-gl";
import { useMapInstance } from "./MapLibreContainer";

interface UserLocationMarkerProps {
  lat: number;
  lng: number;
  isNavigating?: boolean;
  heading?: number;
  isCourseUp?: boolean;
}

export function UserLocationMarker({
  lat,
  lng,
  isNavigating = false,
  heading = 0,
  isCourseUp = false,
}: UserLocationMarkerProps) {
  const map = useMapInstance();
  const markerRef = useRef<Marker | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const prevVisualStateRef = useRef<string>("");

  // Helper to build marker HTML content
  const renderMarkerHtml = () => {
    if (isNavigating && isCourseUp) {
      return `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;pointer-events:none;">
          <!-- Glowing pulse halo -->
          <div style="
            position:absolute;
            width:44px;height:44px;
            border-radius:50%;
            background:radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(6,182,212,0) 75%);
            animation:pulse 2s infinite ease-out;
          "></div>
          <!-- Directional forward pointer (pointing straight UP, matching map camera bearing) -->
          <div style="
            position:relative;
            width:32px;height:32px;
            display:flex;align-items:center;justify-content:center;
            filter:drop-shadow(0 4px 8px rgba(0,0,0,0.6));
          ">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3L28 27L16 21L4 27L16 3Z" fill="#06B6D4" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M16 6L24 23L16 19L8 23L16 6Z" fill="#22D3EE"/>
            </svg>
          </div>
        </div>
      `;
    }

    // Normal Map Mode: Pulsing dot with optional compass beam
    return `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;pointer-events:none;">
        ${
          heading > 0
            ? `<div style="
                position:absolute;
                width:0;height:0;
                border-left:14px solid transparent;
                border-right:14px solid transparent;
                border-bottom:28px solid rgba(6,182,212,0.35);
                top:-10px;
                transform-origin:bottom center;
                transform:rotate(${heading}deg);
                pointer-events:none;
              "></div>`
            : ""
        }
        <div style="
          position:absolute;
          width:36px;height:36px;
          border-radius:50%;
          background:rgba(6,182,212,0.25);
          border:1.5px solid rgba(6,182,212,0.6);
        "></div>
        <div style="
          position:relative;
          width:16px;height:16px;
          border-radius:50%;
          background:#06b6d4;
          border:2.5px solid #ffffff;
          box-shadow:0 0 14px rgba(6,182,212,0.9), 0 2px 6px rgba(0,0,0,0.5);
        "></div>
      </div>
    `;
  };

  useEffect(() => {
    if (!map || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const headingBucket = Math.round(heading / 5) * 5;
    const visualKey = `${isNavigating}-${isCourseUp}-${headingBucket}`;

    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.innerHTML = renderMarkerHtml();
      elementRef.current = el;

      const marker = new Marker({
        element: el,
        anchor: "center",
        rotationAlignment: "viewport",
        pitchAlignment: "viewport",
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markerRef.current = marker;
      prevVisualStateRef.current = visualKey;
    } else {
      markerRef.current.setLngLat([lng, lat]);
      if (visualKey !== prevVisualStateRef.current && elementRef.current) {
        elementRef.current.innerHTML = renderMarkerHtml();
        prevVisualStateRef.current = visualKey;
      }
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, lat, lng, isNavigating, heading, isCourseUp]);

  return null;
}
