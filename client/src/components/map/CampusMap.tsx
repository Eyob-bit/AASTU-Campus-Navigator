import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { Navigation2, Compass } from "lucide-react";

import { useBuildings } from "@/hooks/useBuildings";
import { useLandmarks } from "@/hooks/useLandmarks";
import { useAppStore, useAppActions } from "@/store";
import { useOutdoorRoute, useLiveNavigation, useHeadingFusion } from "@/hooks";
import { OutdoorNavOverlay, ArrivalBottomSheet, BuildingTransitionOverlay, IndoorGuidanceCard } from "@/components/navigation";
import type { Building, Landmark } from "@/types";

import { GoogleMapsContainer } from "./GoogleMapsContainer";
import { NavigationCamera } from "./NavigationCamera";
import { BuildingMarker } from "./BuildingMarker";
import { LandmarkMarker } from "./LandmarkMarker";
import { UserLocationMarker } from "./UserLocationMarker";
import { WalkingRoutePolyline } from "./WalkingRoutePolyline";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { MapErrorOverlay } from "./MapErrorOverlay";
import { CampusBoundaryPolygon } from "./CampusBoundaryPolygon";
import {
  AASTU_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  type TileMode,
} from "./mapConfig";

export { AASTU_CENTER, type TileMode };

// How often the live GPS position is pushed into the app store, in ms.
const STORE_UPDATE_INTERVAL_MS = 500;

function getCardinalDirection(heading: number): string {
  const normalized = ((heading % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return "N";
  if (normalized >= 22.5 && normalized < 67.5) return "NE";
  if (normalized >= 67.5 && normalized < 112.5) return "E";
  if (normalized >= 112.5 && normalized < 157.5) return "SE";
  if (normalized >= 157.5 && normalized < 202.5) return "S";
  if (normalized >= 202.5 && normalized < 247.5) return "SW";
  if (normalized >= 247.5 && normalized < 292.5) return "W";
  return "NW";
}

// ── Floating Map Controls (GPS Pin + Satellite toggle + Rotate buttons) ───────
interface MapControlsProps {
  tileMode: TileMode;
  onToggleTile: () => void;
  onCenterLocation: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
}

const MapControls = memo(function MapControls({
  tileMode,
  onToggleTile,
  onCenterLocation,
  onRotateLeft,
  onRotateRight,
}: MapControlsProps) {
  return (
    <div
      className="absolute bottom-24 right-3 sm:right-4 z-[1000] flex flex-col gap-2 pointer-events-auto select-none"
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
          <>
            <span style={{ fontSize: 13 }}>🛰️</span><span>Satellite</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 13 }}>🗺️</span><span>Street</span>
          </>
        )}
      </button>

      {/* Manual Rotate Left / Right */}
      <div className="flex gap-1">
        <button
          onClick={onRotateLeft}
          className="flex h-10 flex-1 items-center justify-center rounded-xl bg-[#0B132B]/95 text-cyan-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95 text-xs font-bold"
          title="Rotate Left (-15°)"
        >
          ↺ 15°
        </button>
        <button
          onClick={onRotateRight}
          className="flex h-10 flex-1 items-center justify-center rounded-xl bg-[#0B132B]/95 text-cyan-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95 text-xs font-bold"
          title="Rotate Right (+15°)"
        >
          ↻ 15°
        </button>
      </div>

      {/* Center on my location */}
      <button
        onClick={onCenterLocation}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B132B]/95 text-cyan-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95 self-end"
        title="Center on My Location"
      >
        <span style={{ fontSize: 16 }}>🎯</span>
      </button>
    </div>
  );
});

// ── Static Marker Layers ──────────────────────────────────────────────────────
interface MarkerLayersProps {
  standaloneBuildings: Building[];
  landmarks: Landmark[];
  buildingCodeByLandmarkId: Map<string, string | undefined>;
}

/**
 * Building and landmark pins. Memoised and isolated from the rest of the map so that
 * position, heading and route updates can never reconcile these lists.
 */
const MarkerLayers = memo(function MarkerLayers({
  standaloneBuildings,
  landmarks,
  buildingCodeByLandmarkId,
}: MarkerLayersProps) {
  return (
    <>
      {standaloneBuildings.map((building) => (
        <BuildingMarker key={building.id} building={building} />
      ))}
      {landmarks.map((landmark) => (
        <LandmarkMarker
          key={landmark.id}
          landmark={landmark}
          buildingCode={buildingCodeByLandmarkId.get(landmark.id)}
        />
      ))}
    </>
  );
});

// ── Main Map Component ────────────────────────────────────────────────────────
interface CampusMapProps {
  className?: string;
  visibleOnly?: boolean;
}

export function CampusMap({ className, visibleOnly = false }: CampusMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { buildings, isLoading: buildingsLoading, error: buildingsError, fetchBuildings } =
    useBuildings();
  const { landmarks, isLoading: landmarksLoading, fetchLandmarks } = useLandmarks();

  const navStep = useAppStore((s) => s.navStep);
  const userLocation = useAppStore((s) => s.userLocation);
  const activeRoute = useAppStore((s) => s.activeRoute);
  const { setUserLocation, startOutdoorNavigation } = useAppActions();

  const isNavigating = navStep === "OUTDOOR_NAV";

  // Continuous live GPS tracking with high accuracy enabled.
  const { userPosition } = useLiveNavigation({ enabled: true, highAccuracy: true });

  // Heading fusion (device compass + GPS course with circular EMA smoothing).
  // The heading is delivered by subscription rather than state — at ~10Hz, holding it
  // in state here would re-render the entire map subtree ten times a second.
  const {
    subscribeHeading,
    requestPermission: requestCompassPermission,
  } = useHeadingFusion({
    gpsHeading: userPosition?.heading,
    gpsSpeed: userPosition?.speed,
    enabled: true,
  });

  // ── Throttled position → store, trailing edge ──────────────────────────────
  // Fixes arriving inside the throttle window are held and flushed on a timer rather
  // than dropped, so the marker never lags a whole GPS interval behind.
  const lastStoreUpdateRef = useRef<number>(0);
  const pendingPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userPosition) return;

    const next = { lat: userPosition.latitude, lng: userPosition.longitude };
    const elapsed = Date.now() - lastStoreUpdateRef.current;

    if (elapsed >= STORE_UPDATE_INTERVAL_MS) {
      lastStoreUpdateRef.current = Date.now();
      pendingPositionRef.current = null;
      setUserLocation(next);
      return;
    }

    pendingPositionRef.current = next;
    if (flushTimerRef.current === null) {
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        const pending = pendingPositionRef.current;
        pendingPositionRef.current = null;
        if (pending) {
          lastStoreUpdateRef.current = Date.now();
          setUserLocation(pending);
        }
      }, STORE_UPDATE_INTERVAL_MS - elapsed);
    }
  }, [userPosition, setUserLocation]);

  useEffect(
    () => () => {
      if (flushTimerRef.current !== null) clearTimeout(flushTimerRef.current);
    },
    []
  );

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

  const handleRecenter = useCallback(async () => {
    await requestCompassPermission();
    setShouldCenterLocation(true);
  }, [requestCompassPermission]);

  const handleToggleTile = useCallback(
    () => setTileMode((prev) => (prev === "street" ? "satellite" : "street")),
    []
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
        window.dispatchEvent(new CustomEvent("aatsu_navigate", {
          detail: { path: `/dashboard/nav-preview/${customEvent.detail.sceneId}` },
        }));
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

  const [mapHeading, setMapHeading] = useState<number>(0);

  // Set map ref when Google Maps instance becomes available
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.addListener("heading_changed", () => {
      setMapHeading(map.getHeading() ?? 0);
    });
  }, []);

  const handleResetNorth = useCallback(() => {
    if (mapRef.current && typeof google !== "undefined" && google.maps) {
      mapRef.current.setHeading(0);
      setMapHeading(0);
    }
  }, []);

  const handleRotateLeft = useCallback(() => {
    if (mapRef.current) {
      const current = mapRef.current.getHeading() || 0;
      const next = (current - 15 + 360) % 360;
      mapRef.current.setHeading(next);
      setMapHeading(next);
    }
  }, []);

  const handleRotateRight = useCallback(() => {
    if (mapRef.current) {
      const current = mapRef.current.getHeading() || 0;
      const next = (current + 15) % 360;
      mapRef.current.setHeading(next);
      setMapHeading(next);
    }
  }, []);

  // Map building lookup map by ID and normalized name
  const buildingById = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);
  const buildingByName = useMemo(
    () => new Map(buildings.map((b) => [b.name.toLowerCase().trim(), b])),
    [buildings]
  );

  // Resolve each landmark to its matching building once, rather than inside render.
  const matchedBuildingByLandmarkId = useMemo(() => {
    const map = new Map<string, Building | undefined>();
    for (const landmark of landmarks) {
      const match =
        (landmark.buildingId ? buildingById.get(landmark.buildingId) : undefined) ||
        buildingByName.get(landmark.name.toLowerCase().trim());
      map.set(landmark.id, match);
    }
    return map;
  }, [landmarks, buildingById, buildingByName]);

  const buildingCodeByLandmarkId = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const landmark of landmarks) {
      const matched = matchedBuildingByLandmarkId.get(landmark.id);
      map.set(landmark.id, matched?.code ?? landmark.building?.code);
    }
    return map;
  }, [landmarks, matchedBuildingByLandmarkId]);

  // Set of building IDs that are matched to a landmark
  const coveredBuildingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const landmark of landmarks) {
      const matched = matchedBuildingByLandmarkId.get(landmark.id);
      if (matched) ids.add(matched.id);
    }
    return ids;
  }, [landmarks, matchedBuildingByLandmarkId]);

  // Standalone buildings (not merged into a landmark)
  const standaloneBuildings = useMemo(
    () => buildings.filter((b) => b.isActive !== false && !coveredBuildingIds.has(b.id)),
    [buildings, coveredBuildingIds]
  );

  // Dynamic active route polyline starting from userLocation
  const activePolyline = useMemo(() => {
    if (!activeRoute || activeRoute.coordinates.length < 2 || !userLocation) {
      return activeRoute?.coordinates ?? [];
    }

    const polyline = activeRoute.coordinates;
    let bestDist = Infinity;
    let bestIdx = 0;
    const { lat, lng } = userLocation;

    for (let i = 0; i < polyline.length - 1; i++) {
      const [aLat, aLng] = polyline[i];
      const [bLat, bLng] = polyline[i + 1];
      const midLat = ((aLat + bLat) / 2) * (Math.PI / 180);
      const cosLat = Math.cos(midLat);
      const dLat = bLat - aLat;
      const dLng = (bLng - aLng) * cosLat;
      const segLenSq = dLat * dLat + dLng * dLng;

      if (segLenSq < 1e-18) {
        const distSq = (lat - aLat) ** 2 + ((lng - aLng) * cosLat) ** 2;
        if (distSq < bestDist) {
          bestDist = distSq;
          bestIdx = i;
        }
        continue;
      }

      const pDeltaLat = lat - aLat;
      const pDeltaLng = (lng - aLng) * cosLat;
      const t = Math.max(0, Math.min(1, (pDeltaLat * dLat + pDeltaLng * dLng) / segLenSq));
      const projLat = aLat + t * dLat;
      const projLng = aLng + t * dLng;
      const distSq = (lat - projLat) ** 2 + ((lng - projLng) * cosLat) ** 2;

      if (distSq < bestDist) {
        bestDist = distSq;
        bestIdx = i;
      }
    }

    const remainingNodes = polyline.slice(bestIdx + 1);
    return [[lat, lng], ...remainingNodes] as [number, number][];
  }, [activeRoute, userLocation]);

  return (
    <div
      className={className ?? "relative h-full w-full overflow-hidden bg-slate-950 select-none"}
      style={{ height: "100%", width: "100%", minHeight: "350px", overflow: "hidden" }}
    >
      <GoogleMapsContainer
        center={AASTU_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        tileMode={tileMode}
        className="h-full w-full"
        onMapReady={handleMapReady}
      >
        {/* Navigation Camera Controller */}
        <NavigationCamera
          userLocation={userLocation}
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
            isNavigating={isNavigating}
            subscribeHeading={subscribeHeading}
            isCourseUp={isNavigating && isFollowingUser}
            accuracy={userPosition?.accuracy ?? undefined}
          />
        )}

        {/* Outdoor walking route polyline */}
        {isNavigating && activePolyline.length > 1 && (
          <WalkingRoutePolyline positions={activePolyline} />
        )}

        {/* Building & landmark pins */}
        <MarkerLayers
          standaloneBuildings={standaloneBuildings}
          landmarks={landmarks}
          buildingCodeByLandmarkId={buildingCodeByLandmarkId}
        />

        {/* Compass/Reset North-Up button */}
        <div
          className="absolute top-6 right-3 sm:right-4 z-[1001] flex items-center gap-2 pointer-events-auto select-none"
          style={{ zIndex: 1001 }}
        >
          <button
            onClick={handleResetNorth}
            className="flex h-10 items-center gap-1.5 px-3 rounded-full bg-[#0B132B]/95 text-cyan-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95"
            title={`Reset to North (Current: ${Math.round(mapHeading)}° ${getCardinalDirection(mapHeading)})`}
          >
            <Compass
              className="h-5 w-5 transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${-mapHeading}deg)` }}
            />
            <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
              {Math.round(((mapHeading % 360) + 360) % 360)}° {getCardinalDirection(mapHeading)}
            </span>
          </button>
        </div>
      </GoogleMapsContainer>

      {/* Floating Map Controls (Street/Satellite toggle & Center Location & Rotate) */}
      <MapControls
        tileMode={tileMode}
        onToggleTile={handleToggleTile}
        onCenterLocation={handleRecenter}
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
      />

      {/* Floating Recenter Pill */}
      {isNavigating && !isFollowingUser && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
          <button
            onClick={handleRecenter}
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
