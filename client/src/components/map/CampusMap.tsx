import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const AASTU_CAMPUS_CENTER: [number, number] = [9.03, 38.76];

const campusIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CampusMapProps {
  className?: string;
}

export function CampusMap({ className }: CampusMapProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });
  }, []);

  return (
    <div
      className={className ?? "h-80 w-full overflow-hidden rounded-2xl border border-slate-200"}
    >
      <MapContainer
        center={AASTU_CAMPUS_CENTER}
        zoom={16}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={AASTU_CAMPUS_CENTER} icon={campusIcon}>
          <Popup>AASTU Main Campus</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
