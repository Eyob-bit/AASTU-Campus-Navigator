import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { useBuildings } from "@/hooks/useBuildings";
import { BuildingMarker } from "./BuildingMarker";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { MapErrorOverlay } from "./MapErrorOverlay";

// Addis Ababa Science and Technology University (AASTU) Center Coordinates
const AASTU_CAMPUS_CENTER: [number, number] = [8.8885, 38.8090];
const DEFAULT_ZOOM = 16;

interface CampusMapProps {
  className?: string;
}

export function CampusMap({ className }: CampusMapProps) {
  const { buildings, isLoading, error, fetchBuildings } = useBuildings();

  useEffect(() => {
    // Leaflet default icon fix for Vite/Webpack bundlers
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });

    fetchBuildings();
  }, [fetchBuildings]);

  return (
    <div className={className ?? "relative h-full w-full overflow-hidden bg-slate-950"}>
      {/* Interactive Map */}
      <MapContainer
        center={AASTU_CAMPUS_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        dragging
        doubleClickZoom
        touchZoom
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic Markers from Backend API */}
        {buildings.map((building) => (
          <BuildingMarker key={building.id} building={building} />
        ))}
      </MapContainer>

      {/* Loading Overlay */}
      {isLoading && <MapLoadingOverlay />}

      {/* Error Overlay */}
      {error && <MapErrorOverlay message={error} onRetry={fetchBuildings} />}
    </div>
  );
}
