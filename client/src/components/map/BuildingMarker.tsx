import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Building as BuildingIcon, Layers, Info } from "lucide-react";
import type { Building } from "@/types";

// Standard Leaflet marker icon configuration
const defaultBuildingIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface BuildingMarkerProps {
  building: Building;
}

export function BuildingMarker({ building }: BuildingMarkerProps) {
  const { name, code, entranceLatitude, entranceLongitude, floors } = building;

  // Validate coordinates
  const lat = Number(entranceLatitude);
  const lng = Number(entranceLongitude);

  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
    return null;
  }

  const floorCountDisplay =
    floors && Array.isArray(floors)
      ? `${floors.length} ${floors.length === 1 ? "Floor" : "Floors"}`
      : "N/A";

  return (
    <Marker position={[lat, lng]} icon={defaultBuildingIcon}>
      <Popup className="building-marker-popup">
        <div className="p-1 min-w-[200px] text-slate-100">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-700/80 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
              <BuildingIcon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm leading-tight text-slate-100 truncate">
                {name}
              </h3>
              <span className="inline-block text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                {code}
              </span>
            </div>
          </div>

          <div className="space-y-1 my-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>
                Floor Count: <strong className="text-white font-semibold">{floorCountDisplay}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold py-1.5 px-3 shadow-md transition-all active:scale-95 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-3.5 w-3.5" />
            <span>View Details</span>
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
