import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { useBuildings } from "@/hooks/useBuildings";
import { useLandmarks } from "@/hooks/useLandmarks";
import { BuildingMarker } from "./BuildingMarker";
import { LandmarkMarker } from "./LandmarkMarker";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { MapErrorOverlay } from "./MapErrorOverlay";
import { MapLegend } from "./MapLegend";
import { CampusBoundaryPolygon } from "./CampusBoundaryPolygon";
import {
  TILE_LAYERS,
  AASTU_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  CAMPUS_BOUNDS,
  type TileMode,
} from "./mapConfig";

export { TILE_LAYERS, type TileMode };

// ── MapResizer — forces tile redraw on mount / resize ─────────────────────────
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);

  return null;
}

// ── Satellite toggle button overlaid on map ───────────────────────────────────
interface TileToggleProps {
  mode: TileMode;
  onToggle: () => void;
}

function TileToggle({ mode, onToggle }: TileToggleProps) {
  return (
    <div
      className="absolute top-16 sm:top-4 right-3 sm:right-4 z-[1000] flex overflow-hidden rounded-xl shadow-2xl"
      style={{ zIndex: 1000 }}
    >
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
          mode === "street"
            ? "bg-[#0B132B]/95 text-white border border-slate-700 hover:bg-slate-800 hover:border-cyan-400"
            : "bg-white/95 text-slate-900 border border-gray-300 hover:bg-gray-100 hover:border-blue-500"
        } backdrop-blur-md shadow-lg active:scale-95`}
        title={mode === "street" ? "Switch to Satellite View" : "Switch to Street View"}
      >
        {mode === "street" ? (
          <>
            <span style={{ fontSize: 13 }}>🛰️</span>
            <span>Satellite</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 13 }}>🗺️</span>
            <span>Street</span>
          </>
        )}
      </button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface CampusMapProps {
  className?: string;
  visibleOnly?: boolean;
}

export function CampusMap({ className, visibleOnly = false }: CampusMapProps) {
  const { buildings, isLoading: buildingsLoading, error: buildingsError, fetchBuildings } =
    useBuildings();
  const { landmarks, isLoading: landmarksLoading, fetchLandmarks } = useLandmarks();

  const [tileMode, setTileMode] = useState<TileMode>("street");

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });

    fetchBuildings();
    fetchLandmarks(visibleOnly);
  }, [fetchBuildings, fetchLandmarks, visibleOnly]);

  const isLoading = buildingsLoading || landmarksLoading;
  const tile = TILE_LAYERS[tileMode];

  // Map building lookup map by ID and normalized name
  const buildingById = new Map(buildings.map((b) => [b.id, b]));
  const buildingByName = new Map(
    buildings.map((b) => [b.name.toLowerCase().trim(), b])
  );

  // Set of building IDs that are matched to a landmark
  const coveredBuildingIds = new Set<string>();

  landmarks.forEach((landmark) => {
    if (landmark.buildingId && buildingById.has(landmark.buildingId)) {
      coveredBuildingIds.add(landmark.buildingId);
    } else {
      const match = buildingByName.get(landmark.name.toLowerCase().trim());
      if (match) {
        coveredBuildingIds.add(match.id);
      }
    }
  });

  // Standalone buildings (not merged into a landmark)
  const standaloneBuildings = buildings.filter(
    (b) => b.isActive !== false && !coveredBuildingIds.has(b.id)
  );

  return (
    <div
      className={className ?? "relative h-full w-full overflow-hidden bg-slate-950"}
      style={{ height: "100%", width: "100%", minHeight: "350px" }}
    >
      <MapContainer
        center={AASTU_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={CAMPUS_BOUNDS}
        maxBoundsViscosity={1.0}
        bounceAtZoomLimits={false}
        scrollWheelZoom
        dragging
        doubleClickZoom
        touchZoom
        zoomControl={false}
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%", minHeight: "350px" }}
      >
        <MapResizer />

        <TileLayer
          key={tileMode}
          attribution={tile.attribution}
          url={tile.url}
          maxNativeZoom={tile.maxNativeZoom}
          maxZoom={MAX_ZOOM}
        />

        {/* AASTU Yellow Campus Boundary Polygon */}
        <CampusBoundaryPolygon />

        {/* Standalone Building markers */}
        {standaloneBuildings.map((building) => (
          <BuildingMarker key={building.id} building={building} />
        ))}

        {/* Landmark markers (merged with building code under name) */}
        {landmarks.map((landmark) => {
          const matchedBuilding =
            (landmark.buildingId ? buildingById.get(landmark.buildingId) : null) ||
            buildingByName.get(landmark.name.toLowerCase().trim()) ||
            landmark.building;

          return (
            <LandmarkMarker
              key={landmark.id}
              landmark={landmark}
              buildingCode={matchedBuilding?.code}
            />
          );
        })}
      </MapContainer>

      {/* Satellite / Street toggle */}
      <TileToggle mode={tileMode} onToggle={() => setTileMode((m) => m === "street" ? "satellite" : "street")} />

      {/* Landmark category legend */}
      <MapLegend />

      {/* Loading and error overlays */}
      {isLoading && <MapLoadingOverlay />}
      {buildingsError && <MapErrorOverlay message={buildingsError} onRetry={fetchBuildings} />}
    </div>
  );
}
