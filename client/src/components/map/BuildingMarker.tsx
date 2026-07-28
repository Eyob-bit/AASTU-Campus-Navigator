import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Layers } from "lucide-react";
import type { Building } from "@/types";


// ── Custom building label DivIcon ─────────────────────────────────────────────

function makeBuildingIcon(name: string, code: string): L.DivIcon {
  const html = `
    <div style="
      display:flex;flex-direction:column;align-items:center;
      pointer-events:none;
    ">
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

  return L.divIcon({
    className: "",
    iconAnchor: [0, 45],
    popupAnchor: [0, -48],
    html,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BuildingMarkerProps {
  building: Building;
}

export function BuildingMarker({ building }: BuildingMarkerProps) {
  const { name, code, entranceLatitude, entranceLongitude, floors } = building;

  const lat = Number(entranceLatitude);
  const lng = Number(entranceLongitude);

  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return null;
  }

  const icon = makeBuildingIcon(name, code);
  const floorCount = floors && Array.isArray(floors) ? floors.length : null;

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup className="campus-popup" maxWidth={240} minWidth={200}>
        <div className="p-1">
          <div className="flex items-start gap-2 mb-2 pb-2 border-b border-slate-700/50">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-500/20 shrink-0">
              <span className="text-base">🏢</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 leading-tight">{name}</p>
              <span className="text-[10px] font-semibold text-cyan-600 uppercase tracking-wider">{code}</span>
            </div>
          </div>

          {floorCount !== null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
              <Layers size={12} className="text-cyan-500 shrink-0" />
              <span>
                {floorCount} {floorCount === 1 ? "Floor" : "Floors"}
              </span>
            </div>
          )}

          <a
            href={`/navigation?buildingId=${building.id}`}
            className="block w-full text-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold py-1.5 px-3 shadow-sm hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Navigate Here
          </a>
        </div>
      </Popup>
    </Marker>
  );
}
