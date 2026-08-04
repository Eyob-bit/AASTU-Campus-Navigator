import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { useBuildings } from "@/hooks/useBuildings";
import { useLandmarks } from "@/hooks/useLandmarks";
import { useAppStore } from "@/store";
import { useOutdoorRoute } from "@/hooks";
import { OutdoorNavOverlay, ArrivalBottomSheet, BuildingTransitionOverlay, IndoorGuidanceCard } from "@/components/navigation";

import { BuildingMarker } from "./BuildingMarker";
import { LandmarkMarker } from "./LandmarkMarker";
import { UserLocationMarker } from "./UserLocationMarker";
import { WalkingRoutePolyline } from "./WalkingRoutePolyline";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { MapErrorOverlay } from "./MapErrorOverlay";
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

// ── Floating Map Controls (GPS Pin + Satellite toggle) ───────────────────────
interface MapControlsProps {
  onCenterLocation: () => void;
  tileMode: TileMode;
  onToggleTile: () => void;
}

function MapControls({ onCenterLocation, tileMode, onToggleTile }: MapControlsProps) {
  return (
    <div
      className="absolute bottom-24 right-3 sm:right-4 z-[1000] flex flex-col gap-2"
      style={{ zIndex: 1000 }}
    >
      {/* Satellite / Street toggle */}
      <button
        onClick={onToggleTile}
        className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xl backdrop-blur-md active:scale-95 ${
          tileMode === "street"
            ? "bg-[#0B132B]/95 text-white border border-slate-700 hover:bg-slate-800 hover:border-cyan-400"
            : "bg-white/95 text-slate-900 border border-gray-300 hover:bg-gray-100 hover:border-blue-500"
        }`}
        title={tileMode === "street" ? "Switch to Satellite View" : "Switch to Street View"}
      >
        {tileMode === "street" ? (
          <><span style={{ fontSize: 13 }}>🛰️</span><span>Satellite</span></>
        ) : (
          <><span style={{ fontSize: 13 }}>🗺️</span><span>Street</span></>
        )}
      </button>

      {/* Center on my location */}
      <button
        onClick={onCenterLocation}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B132B]/95 text-cyan-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95"
        title="Center on My Location"
      >
        <span style={{ fontSize: 16 }}>🎯</span>
      </button>
    </div>
  );
}

// Helper to interact with Leaflet map instance
function MapViewController({
  userLocation,
  shouldCenter,
  setShouldCenter,
  navStep,
}: {
  userLocation: { lat: number; lng: number } | null;
  shouldCenter: boolean;
  setShouldCenter: (val: boolean) => void;
  navStep: string;
}) {
  const map = useMap();

  // Manual center button click
  useEffect(() => {
    if (shouldCenter && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 18, { animate: true, duration: 1 });
      setShouldCenter(false);
    }
  }, [shouldCenter, userLocation, map, setShouldCenter]);

  // Listen for AI chatbot "Show on Map" center events
  useEffect(() => {
    function handleCenterBuilding(e: Event) {
      const customEvent = e as CustomEvent<{ lat: number; lng: number; zoom?: number }>;
      if (customEvent.detail?.lat && customEvent.detail?.lng) {
        map.flyTo([customEvent.detail.lat, customEvent.detail.lng], customEvent.detail.zoom ?? 19, {
          animate: true,
          duration: 1.2,
        });
      }
    }
    window.addEventListener("aastu_center_building", handleCenterBuilding);
    return () => window.removeEventListener("aastu_center_building", handleCenterBuilding);
  }, [map]);

  // Smooth camera following during active outdoor navigation
  useEffect(() => {

    if (navStep === "OUTDOOR_NAV" && userLocation) {
      map.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 0.8 });
    }
  }, [navStep, userLocation, map]);

  return null;
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

  const {
    navStep,
    userLocation,
    setUserLocation,
    activeRoute,
    startOutdoorNavigation,
  } = useAppStore();

  // Fetch A* route from server; handles auto-rerouting on position change
  useOutdoorRoute();

  const [tileMode, setTileMode] = useState<TileMode>("street");
  const [shouldCenterLocation, setShouldCenterLocation] = useState<boolean>(false);

  // Listen for AI Chatbot Action Triggers
  useEffect(() => {
    function handleStartNav(e: Event) {
      const customEvent = e as CustomEvent<{
        name: string;
        latitude: number;
        longitude: number;
        buildingId?: string;
        officeId?: string;
      }>;
      if (customEvent.detail && customEvent.detail.latitude && customEvent.detail.longitude) {
        startOutdoorNavigation({
          id: customEvent.detail.officeId || customEvent.detail.buildingId || "custom-target",
          type: customEvent.detail.officeId ? "OFFICE" : "BUILDING",
          name: customEvent.detail.name || "Destination",
          latitude: customEvent.detail.latitude,
          longitude: customEvent.detail.longitude,
          buildingId: customEvent.detail.buildingId,
          officeId: customEvent.detail.officeId,
        });
      }
    }

    function handleOpenPanorama(e: Event) {
      const customEvent = e as CustomEvent<{ sceneId: string }>;
      if (customEvent.detail?.sceneId) {
        window.location.href = `/dashboard/nav-preview/${customEvent.detail.sceneId}`;
      }
    }

    window.addEventListener("aastu_start_navigation", handleStartNav);
    window.addEventListener("aastu_open_panorama", handleOpenPanorama);

    return () => {
      window.removeEventListener("aastu_start_navigation", handleStartNav);
      window.removeEventListener("aastu_open_panorama", handleOpenPanorama);
    };
  }, [startOutdoorNavigation]);

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
        <MapViewController
          userLocation={userLocation}
          shouldCenter={shouldCenterLocation}
          setShouldCenter={setShouldCenterLocation}
          navStep={navStep}
        />

        <TileLayer
          key={tileMode}
          attribution={tile.attribution}
          url={tile.url}
          maxNativeZoom={tile.maxNativeZoom}
          maxZoom={MAX_ZOOM}
        />


        {/* AASTU Yellow Campus Boundary Polygon */}
        <CampusBoundaryPolygon />

        {/* User GPS location marker */}
        {userLocation && (
          <UserLocationMarker lat={userLocation.lat} lng={userLocation.lng} />
        )}

        {/* Outdoor walking route polyline — coordinates from A* API */}
        {navStep === "OUTDOOR_NAV" && activeRoute && activeRoute.coordinates.length > 1 && (
          <WalkingRoutePolyline positions={activeRoute.coordinates} />
        )}

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

      {/* Floating controls: Satellite + GPS pin */}
      <MapControls
        tileMode={tileMode}
        onToggleTile={() => setTileMode((m) => m === "street" ? "satellite" : "street")}
        onCenterLocation={() => {
          if (!userLocation) {
            setUserLocation({ lat: 8.88218, lng: 38.79665 });
          }
          setShouldCenterLocation(true);
        }}
      />

      {/* Navigation Overlays & State Machine Modals */}
      {navStep === "OUTDOOR_NAV" && <OutdoorNavOverlay />}
      {navStep === "ARRIVAL_BOTSHEET" && <ArrivalBottomSheet />}
      {navStep === "BUILDING_TRANSITION" && <BuildingTransitionOverlay />}
      {navStep === "INDOOR_GUIDANCE" && <IndoorGuidanceCard />}

      {/* Loading and error overlays */}
      {isLoading && <MapLoadingOverlay />}
      {buildingsError && <MapErrorOverlay message={buildingsError} onRetry={fetchBuildings} />}
    </div>
  );
}
