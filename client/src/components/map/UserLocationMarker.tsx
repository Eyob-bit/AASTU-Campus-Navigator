import { Marker } from "react-leaflet";
import L from "leaflet";

function makeUserLocationIcon(): L.DivIcon {
  const html = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
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
        box-shadow:0 0 12px rgba(6,182,212,0.8), 0 2px 6px rgba(0,0,0,0.5);
      "></div>
    </div>
  `;

  return L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html,
  });
}

interface UserLocationMarkerProps {
  lat: number;
  lng: number;
}

export function UserLocationMarker({ lat, lng }: UserLocationMarkerProps) {
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return null;
  }

  const icon = makeUserLocationIcon();
  return <Marker position={[lat, lng]} icon={icon} zIndexOffset={2000} />;
}
