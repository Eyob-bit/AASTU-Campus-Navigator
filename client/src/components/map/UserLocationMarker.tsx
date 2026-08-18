import { Marker } from "react-leaflet";
import L from "leaflet";

function makeUserLocationIcon(isNavigating: boolean, heading: number = 0, isCourseUp: boolean = false): L.DivIcon {
  if (isNavigating && isCourseUp) {
    // Google Maps-style navigation chevron/arrow pointing straight UP (since map rotates beneath it)
    const html = `
      <div class="map-marker-unrotate" style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">
        <!-- Glowing pulse halo -->
        <div style="
          position:absolute;
          width:44px;height:44px;
          border-radius:50%;
          background:radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(6,182,212,0) 75%);
          animation:pulse 2s infinite ease-out;
        "></div>
        <!-- Directional forward pointer (Google Maps style arrow) -->
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

    return L.divIcon({
      className: "",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      html,
    });
  }

  // Normal Map Mode: Pulsing dot with optional compass beam
  const html = `
    <div class="map-marker-unrotate" style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;">
      ${
        heading > 0
          ? `<div style="
              position:absolute;
              width:0;height:0;
              border-left:14px solid transparent;
              border-right:14px solid transparent;
              border-bottom:28px solid rgba(6,182,212,0.3);
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

  return L.divIcon({
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html,
  });
}

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
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return null;
  }

  const icon = makeUserLocationIcon(isNavigating, heading, isCourseUp);
  return <Marker position={[lat, lng]} icon={icon} zIndexOffset={2000} />;
}
