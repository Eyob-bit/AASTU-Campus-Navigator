import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Navigation2 } from "lucide-react";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { calculateDistanceInMeters } from "@/utils/geo";
import { useBuildings } from "@/hooks/useBuildings";
import { useLandmarks } from "@/hooks/useLandmarks";
import { useAppStore } from "@/store";
import { useOutdoorRoute, useLiveNavigation, useHeadingFusion } from "@/hooks";
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

/**
 * Calculates a point shifted forward along a travel heading vector
 * to keep the user marker anchored at ~65-70% down the screen in course-up view.
 */
function getForwardOffsetCoord(
  lat: number,
  lng: number,
  headingDeg: number,
  offsetMeters: number
): [number, number] {
  const headingRad = (headingDeg * Math.PI) / 180;
  const latOffset = (offsetMeters * Math.cos(headingRad)) / 111320;
  const lngOffset = (offsetMeters * Math.sin(headingRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat + latOffset, lng + lngOffset];
}

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

// ── Floating Map Controls (GPS Pin + Satellite toggle + Compass Reset) ────────
interface MapControlsProps {
  onCenterLocation: () => void;
  tileMode: TileMode;
  onToggleTile: () => void;
  rotationAngle?: number;
  onResetRotation?: () => void;
}

function MapControls({
  onCenterLocation,
  tileMode,
  onToggleTile,
  rotationAngle = 0,
  onResetRotation,
}: MapControlsProps) {
  const isRotated = Math.abs(rotationAngle) > 1;

  return (
    <div
      className="absolute bottom-24 right-3 sm:right-4 z-[1000] flex flex-col gap-2 pointer-events-auto select-none"
      style={{ zIndex: 1000 }}
    >
      {/* Compass Reset Rotation Button */}
      {isRotated && (
        <button
          onClick={onResetRotation}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B132B]/95 text-amber-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95"
          title={`Reset Map Rotation (${rotationAngle.toFixed(1)}°) to North`}
        >
          <span
            style={{
              display: "inline-block",
              transform: `rotate(${-rotationAngle}deg)`,
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

// ── MapViewController — Camera following and orientation orchestration ────────
interface MapViewControllerProps {
  userLocation: { lat: number; lng: number } | null;
  shouldCenter: boolean;
  setShouldCenter: (val: boolean) => void;
  navStep: string;
  isFollowingUser: boolean;
  setIsFollowingUser: (val: boolean) => void;
  fusedHeading: number;
}

function MapViewController({
  userLocation,
  shouldCenter,
  setShouldCenter,
  navStep,
  isFollowingUser,
  setIsFollowingUser,
  fusedHeading,
}: MapViewControllerProps) {
  const map = useMap();
  const { destinationTarget } = useAppStore();
  const hasFitRouteRef = useRef(false);
  const lastPanPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastPanTimeRef = useRef<number>(0);

  // Pause camera auto-follow ONLY on real user drag/pan gestures
  useEffect(() => {
    function handleManualDrag() {
      setIsFollowingUser(false);
    }

    map.on("dragstart", handleManualDrag);

    return () => {
      map.off("dragstart", handleManualDrag);
    };
  }, [map, setIsFollowingUser]);

  // Initial fit bounds when outdoor navigation begins
  useEffect(() => {
    if (navStep === "OUTDOOR_NAV" && destinationTarget && userLocation && !hasFitRouteRef.current) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [destinationTarget.latitude, destinationTarget.longitude]
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18, animate: true, duration: 1 });
      hasFitRouteRef.current = true;
    }
    if (navStep !== "OUTDOOR_NAV") {
      hasFitRouteRef.current = false;
      setIsFollowingUser(true);
    }
  }, [navStep, destinationTarget, userLocation, map, setIsFollowingUser]);

  // Handle manual recenter / center button
  useEffect(() => {
    if (shouldCenter && userLocation) {
      setIsFollowingUser(true);
      const targetZoom = Math.max(map.getZoom(), 18);

      if (navStep === "OUTDOOR_NAV") {
        const forwardOffset = targetZoom >= 19 ? 18 : targetZoom >= 18 ? 24 : 32;
        const [targetLat, targetLng] = getForwardOffsetCoord(
          userLocation.lat,
          userLocation.lng,
          fusedHeading,
          forwardOffset
        );
        map.flyTo([targetLat, targetLng], targetZoom, { animate: true, duration: 0.8 });
      } else {
        map.flyTo([userLocation.lat, userLocation.lng], targetZoom, { animate: true, duration: 0.8 });
      }

      setShouldCenter(false);
    }
  }, [shouldCenter, userLocation, map, setShouldCenter, setIsFollowingUser, navStep, fusedHeading]);

  // Listen for AI chatbot "Show on Map" events
  useEffect(() => {
    function handleCenterBuilding(e: Event) {
      const customEvent = e as CustomEvent<{ lat: number; lng: number; zoom?: number }>;
      if (customEvent.detail?.lat && customEvent.detail?.lng) {
        setIsFollowingUser(false);
        map.flyTo([customEvent.detail.lat, customEvent.detail.lng], customEvent.detail.zoom ?? 19, {
          animate: true,
          duration: 1.2,
        });
      }
    }
    window.addEventListener("aastu_center_building", handleCenterBuilding);
    return () => window.removeEventListener("aastu_center_building", handleCenterBuilding);
  }, [map, setIsFollowingUser]);

  // Live Navigation Camera Follow (Separated from Bearing Rotation)
  useEffect(() => {
    if (navStep === "OUTDOOR_NAV" && userLocation && isFollowingUser) {
      const now = Date.now();
      const lastPos = lastPanPosRef.current;
      const elapsed = now - lastPanTimeRef.current;

      const dist = lastPos
        ? calculateDistanceInMeters(userLocation.lat, userLocation.lng, lastPos.lat, lastPos.lng)
        : Infinity;

      // Smooth camera follow with forward perspective offset (~20-30m)
      if (lastPos === null || dist >= 2.0 || elapsed >= 400) {
        lastPanPosRef.current = userLocation;
        lastPanTimeRef.current = now;

        const currentZoom = map.getZoom();
        const forwardOffset = currentZoom >= 19 ? 18 : currentZoom >= 18 ? 24 : 32;
        const [targetLat, targetLng] = getForwardOffsetCoord(
          userLocation.lat,
          userLocation.lng,
          fusedHeading,
          forwardOffset
        );

        map.panTo([targetLat, targetLng], {
          animate: true,
          duration: 0.4,
          easeLinearity: 0.35,
        });
      }
    } else if (navStep !== "OUTDOOR_NAV") {
      lastPanPosRef.current = null;
    }
  }, [navStep, userLocation, isFollowingUser, fusedHeading, map]);

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

  // Continuous high-accuracy live GPS tracking
  const { userPosition } = useLiveNavigation({ enabled: true });

  // Heading fusion (Device compass + GPS course with circular EMA smoothing and float precision)
  const {
    heading: fusedHeading,
    requestPermission: requestCompassPermission,
  } = useHeadingFusion({
    gpsHeading: userPosition?.heading,
    gpsSpeed: userPosition?.speed,
    enabled: true,
  });

  useEffect(() => {
    if (userPosition) {
      setUserLocation({ lat: userPosition.latitude, lng: userPosition.longitude });
    }
  }, [userPosition, setUserLocation]);

  // Fetch A* route from server; handles auto-rerouting on sustained position departure
  useOutdoorRoute();

  const [tileMode, setTileMode] = useState<TileMode>("street");
  const [shouldCenterLocation, setShouldCenterLocation] = useState<boolean>(false);
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(true);

  // Dynamic rotation angle applied to the hardware-accelerated map wrapper
  const isNavigatingCourseUp = navStep === "OUTDOOR_NAV" && isFollowingUser;
  const currentRotationAngle = isNavigatingCourseUp ? -fusedHeading : 0;

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
      className={className ?? "relative h-full w-full overflow-hidden bg-slate-950 select-none"}
      style={{ height: "100%", width: "100%", minHeight: "350px", overflow: "hidden" }}
    >
      {/* ── GPU-Accelerated Map Rotation Wrapper ── */}
      <div
        id="map-rotation-wrapper"
        className="h-full w-full origin-center transition-transform duration-200 ease-out"
        style={{
          width: isNavigatingCourseUp ? "142%" : "100%",
          height: isNavigatingCourseUp ? "142%" : "100%",
          margin: isNavigatingCourseUp ? "-21%" : "0",
          transform: isNavigatingCourseUp ? `rotate(${currentRotationAngle}deg)` : "rotate(0deg)",
          transformOrigin: "50% 50%",
          willChange: isNavigatingCourseUp ? "transform" : "auto",
        }}
      >
        <MapContainer
          center={AASTU_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          maxBounds={CAMPUS_BOUNDS}
          maxBoundsViscosity={0.5}
          bounceAtZoomLimits={false}
          scrollWheelZoom
          dragging
          doubleClickZoom
          zoomControl={false}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <MapResizer />
          <MapViewController
            userLocation={userLocation}
            shouldCenter={shouldCenterLocation}
            setShouldCenter={setShouldCenterLocation}
            navStep={navStep}
            isFollowingUser={isFollowingUser}
            setIsFollowingUser={setIsFollowingUser}
            fusedHeading={fusedHeading}
          />

          {/* Base Map Tiles */}
          <TileLayer
            key={tileMode}
            attribution={tile.attribution}
            url={tile.url}
            maxNativeZoom={tile.maxNativeZoom}
            maxZoom={MAX_ZOOM}
          />

          {/* AASTU Campus Boundary Polygon */}
          <CampusBoundaryPolygon />

          {/* User GPS location marker (renders forward-facing arrow in Course-Up mode) */}
          {userLocation && (
            <UserLocationMarker
              lat={userLocation.lat}
              lng={userLocation.lng}
              isNavigating={navStep === "OUTDOOR_NAV"}
              heading={fusedHeading}
              isCourseUp={isNavigatingCourseUp}
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
        </MapContainer>
      </div>

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

      {/* Floating controls: Satellite + GPS pin + Compass Reset */}
      <MapControls
        tileMode={tileMode}
        onToggleTile={() => setTileMode((m) => m === "street" ? "satellite" : "street")}
        rotationAngle={currentRotationAngle}
        onResetRotation={() => {
          setIsFollowingUser(false);
        }}
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
