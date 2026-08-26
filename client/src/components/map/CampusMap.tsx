import { useEffect, useState, useCallback, useRef } from "react";
import { Navigation2 } from "lucide-react";

import { useBuildings } from "@/hooks/useBuildings";
import { useLandmarks } from "@/hooks/useLandmarks";
import { useAppStore } from "@/store";
import { useOutdoorRoute, useLiveNavigation, useHeadingFusion } from "@/hooks";
import { OutdoorNavOverlay, ArrivalBottomSheet, BuildingTransitionOverlay, IndoorGuidanceCard } from "@/components/navigation";

import { MapLibreContainer, useMapInstance } from "./MapLibreContainer";
import { NavigationCamera } from "./NavigationCamera";
import { BuildingMarker } from "./BuildingMarker";
import { LandmarkMarker } from "./LandmarkMarker";
import { UserLocationMarker } from "./UserLocationMarker";
import { WalkingRoutePolyline } from "./WalkingRoutePolyline";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { MapErrorOverlay } from "./MapErrorOverlay";
import { CampusBoundaryPolygon } from "./CampusBoundaryPolygon";
import {
  TILE_LAYERS,
  AASTU_CENTER_LNG_LAT,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  type TileMode,
} from "./mapConfig";

export { TILE_LAYERS, type TileMode };

// ── Floating Map Controls (GPS Pin + Satellite toggle + Compass Reset) ────────
interface MapControlsProps {
  onCenterLocation: () => void;
  tileMode: TileMode;
  onToggleTile: () => void;
  onPauseFollow: () => void;
}

function MapControls({
  onCenterLocation,
  tileMode,
  onToggleTile,
  onPauseFollow,
}: MapControlsProps) {
  const map = useMapInstance();
  const [bearing, setBearing] = useState<number>(0);

  useEffect(() => {
    if (!map) return;
    const updateBearing = () => setBearing(map.getBearing());
    updateBearing();
    map.on("rotate", updateBearing);
    return () => {
      map.off("rotate", updateBearing);
    };
  }, [map]);

  const isRotated = Math.abs(bearing) > 1;

  const handleResetRotation = () => {
    onPauseFollow();
    if (map) {
      map.easeTo({ bearing: 0, pitch: 0, duration: 400 });
    }
  };

  return (
    <div
      className="absolute bottom-24 right-3 sm:right-4 z-[1000] flex flex-col gap-2 pointer-events-auto select-none"
      style={{ zIndex: 1000 }}
    >
      {/* Compass Reset Rotation Button */}
      {isRotated && (
        <button
          onClick={handleResetRotation}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B132B]/95 text-amber-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95"
          title={`Reset Map Rotation (${bearing.toFixed(1)}°) to North`}
        >
          <span
            style={{
              display: "inline-block",
              transform: `rotate(${-bearing}deg)`,
              transition: "transform 0.15s ease-out",
              fontSize: 16,
            }}
          >
            🧭
          </span>
        </button>
      )}

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

// ── Main Map Component ────────────────────────────────────────────────────────
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

  // Continuous high-accuracy live GPS tracking
  const { userPosition } = useLiveNavigation({ enabled: true });

  // Heading fusion (Device compass + GPS course with circular EMA smoothing)
  const {
    heading: fusedHeading,
    requestPermission: requestCompassPermission,
  } = useHeadingFusion({
    gpsHeading: userPosition?.heading,
    gpsSpeed: userPosition?.speed,
    enabled: true,
  });

  const lastStoreUpdateRef = useRef<number>(0);
  const STORE_UPDATE_INTERVAL_MS = 500;

  useEffect(() => {
    if (userPosition) {
      const now = Date.now();
      if (now - lastStoreUpdateRef.current >= STORE_UPDATE_INTERVAL_MS || !userLocation) {
        lastStoreUpdateRef.current = now;
        setUserLocation({ lat: userPosition.latitude, lng: userPosition.longitude });
      }
    }
  }, [userPosition, setUserLocation, userLocation]);

  // Fetch A* route from server; handles auto-rerouting on position departure
  useOutdoorRoute();

  const [tileMode, setTileMode] = useState<TileMode>("street");
  const [shouldCenterLocation, setShouldCenterLocation] = useState<boolean>(false);
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(true);

  // Await iOS compass permission before navigation starts
  const handleStartNavWithPermission = useCallback(
    async (params: Parameters<typeof startOutdoorNavigation>[0]) => {
      await requestCompassPermission();
      setIsFollowingUser(true);
      startOutdoorNavigation(params);
    },
    [requestCompassPermission, startOutdoorNavigation]
  );

  // Listen for AI Chatbot Action Triggers
  useEffect(() => {
    function handleStartNav(e: Event) {
      const customEvent = e as CustomEvent<{
        name: string;
        latitude: number;
        longitude: number;
        buildingId?: string;
        buildingName?: string;
        officeId?: string;
        officeName?: string;
        floorId?: string;
        floorNumber?: number;
        roomNumber?: string;
        staffId?: string;
        staffName?: string;
        entrySceneId?: string;
      }>;
      const d = customEvent.detail;
      if (d && d.latitude && d.longitude) {
        const isStaff = Boolean(d.staffId);
        const isOffice = Boolean(d.officeId) && !isStaff;
        handleStartNavWithPermission({
          id: d.staffId || d.officeId || d.buildingId || "custom-target",
          type: isStaff ? "STAFF" : isOffice ? "OFFICE" : "BUILDING",
          name: d.name || "Destination",
          latitude: d.latitude,
          longitude: d.longitude,
          buildingId: d.buildingId,
          buildingName: d.buildingName,
          officeId: d.officeId,
          officeName: d.officeName,
          floorId: d.floorId,
          floorNumber: d.floorNumber,
          roomNumber: d.roomNumber,
          staffName: d.staffName,
          entrySceneId: d.entrySceneId,
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
  }, [handleStartNavWithPermission]);

  useEffect(() => {
    fetchBuildings();
    fetchLandmarks(visibleOnly);
  }, [fetchBuildings, fetchLandmarks, visibleOnly]);

  const isLoading = buildingsLoading || landmarksLoading;

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
      className={className ?? "relative h-full w-full overflow-hidden bg-slate-950 select-none"}
      style={{ height: "100%", width: "100%", minHeight: "350px", overflow: "hidden" }}
    >
      <MapLibreContainer
        center={AASTU_CENTER_LNG_LAT}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        tileMode={tileMode}
        className="h-full w-full"
      >
        {/* Navigation Camera Controller (Sole camera owner during OUTDOOR_NAV) */}
        <NavigationCamera
          userLocation={userLocation}
          fusedHeading={fusedHeading}
          isFollowingUser={isFollowingUser}
          setIsFollowingUser={setIsFollowingUser}
          shouldCenter={shouldCenterLocation}
          setShouldCenter={setShouldCenterLocation}
        />

        {/* AASTU Campus Boundary Polygon */}
        <CampusBoundaryPolygon />

        {/* User GPS location marker */}
        {userLocation && (
          <UserLocationMarker
            lat={userLocation.lat}
            lng={userLocation.lng}
            isNavigating={navStep === "OUTDOOR_NAV"}
            heading={fusedHeading}
            isCourseUp={navStep === "OUTDOOR_NAV" && isFollowingUser}
          />
        )}

        {/* Outdoor walking route polyline — coordinates from A* API */}
        {navStep === "OUTDOOR_NAV" && activeRoute && activeRoute.coordinates.length > 1 && (
          <WalkingRoutePolyline positions={activeRoute.coordinates} />
        )}

        {/* Standalone Building markers */}
        {standaloneBuildings.map((building) => (
          <BuildingMarker key={building.id} building={building} />
        ))}

        {/* Landmark markers */}
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

        {/* Floating Controls (Satellite toggle, center location, reset compass) */}
        <MapControls
          tileMode={tileMode}
          onToggleTile={() => setTileMode((m) => (m === "street" ? "satellite" : "street"))}
          onPauseFollow={() => setIsFollowingUser(false)}
          onCenterLocation={() => {
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  setShouldCenterLocation(true);
                },
                () => {
                  if (!userLocation) setUserLocation({ lat: 8.88218, lng: 38.79665 });
                  setShouldCenterLocation(true);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
              );
            } else {
              if (!userLocation) setUserLocation({ lat: 8.88218, lng: 38.79665 });
              setShouldCenterLocation(true);
            }
          }}
        />
      </MapLibreContainer>

      {/* Floating Recenter Pill (shown when user manually panned during active navigation) */}
      {navStep === "OUTDOOR_NAV" && !isFollowingUser && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
          <button
            onClick={async () => {
              await requestCompassPermission();
              setShouldCenterLocation(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs shadow-2xl shadow-cyan-500/40 border border-cyan-300 hover:bg-cyan-400 active:scale-95 transition-all cursor-pointer"
          >
            <Navigation2 className="h-3.5 w-3.5 fill-current" />
            <span>Recenter Navigation</span>
          </button>
        </div>
      )}

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
