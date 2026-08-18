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
  const isRotated = Math.round(rotationAngle) !== 0;

  return (
    <div
      className="absolute bottom-24 right-3 sm:right-4 z-[1000] flex flex-col gap-2 pointer-events-auto"
      style={{ zIndex: 1000 }}
    >
      {/* Compass Reset Rotation Button */}
      {isRotated && (
        <button
          onClick={onResetRotation}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B132B]/95 text-amber-400 border border-slate-700 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95"
          title={`Reset Map Rotation (${Math.round(rotationAngle)}°) to North`}
        >
          <span
            style={{
              display: "inline-block",
              transform: `rotate(${-rotationAngle}deg)`,
              transition: "transform 0.2s ease-out",
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

// ── Master Helper: Apply Map Rotation Transform safely ────────────────────────
function applyMapRotation(map: L.Map, angle: number) {
  const container = map.getContainer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (map as any)._mapRotationAngle = angle;

  const mapPane = ((map as any)._mapPane || container.querySelector(".leaflet-map-pane")) as HTMLElement | null;
  if (!mapPane) return;

  mapPane.style.transformOrigin = "50% 50%";
  const currentTransform = mapPane.style.transform || "";
  const baseTransform = currentTransform.replace(/rotate\([^)]*\)/g, "").trim();

  if (angle !== 0) {
    mapPane.style.transform = `${baseTransform} rotate(${angle}deg)`;
  } else {
    mapPane.style.transform = baseTransform;
  }

  // Counter-rotate marker icons & building labels so text ALWAYS remains upright!
  const unrotateEls = container.querySelectorAll(".map-marker-unrotate") as NodeListOf<HTMLElement>;
  unrotateEls.forEach((el) => {
    el.style.transformOrigin = "center center";
    el.style.transform = angle !== 0 ? `rotate(${-angle}deg)` : "";
  });
}

// ── MapRotationController — touch & programmatic map rotation controller ──────
function MapRotationController({
  rotationAngle,
  setRotationAngle,
}: {
  rotationAngle: number;
  setRotationAngle: React.Dispatch<React.SetStateAction<number>>;
}) {
  const map = useMap();
  const rotationRef = useRef(rotationAngle);
  rotationRef.current = rotationAngle;

  // 1. Keep map instance updated with current rotation angle ref
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map as any)._mapRotationAngle = rotationAngle;
    applyMapRotation(map, rotationAngle);
  }, [map, rotationAngle]);

  // 2. Patch Leaflet's L.DomUtil.setPosition & L.Map.prototype.mouseEventToContainerPoint
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const domUtilAny = L.DomUtil as any;
    if (!domUtilAny._origSetPosition) {
      domUtilAny._origSetPosition = L.DomUtil.setPosition;
      L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point) {
        domUtilAny._origSetPosition.call(this, el, point);
        if (el && el.classList && el.classList.contains("leaflet-map-pane")) {
          const angle = rotationRef.current || 0;
          if (angle) {
            el.style.transformOrigin = "50% 50%";
            const base = el.style.transform.replace(/rotate\([^)]*\)/g, "").trim();
            el.style.transform = `${base} rotate(${angle}deg)`;
          }
        }
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapProtoAny = L.Map.prototype as any;
    if (!mapProtoAny._origMouseEventToContainerPoint) {
      mapProtoAny._origMouseEventToContainerPoint = L.Map.prototype.mouseEventToContainerPoint;
      L.Map.prototype.mouseEventToContainerPoint = function (e: MouseEvent | Touch): L.Point {
        const point = mapProtoAny._origMouseEventToContainerPoint.call(this, e);
        const angle = rotationRef.current || 0;
        if (!angle) return point;

        const size = this.getSize();
        const cx = size.x / 2;
        const cy = size.y / 2;
        const rad = (-angle * Math.PI) / 180;
        const dx = point.x - cx;
        const dy = point.y - cy;

        const unrotatedX = cx + (dx * Math.cos(rad) - dy * Math.sin(rad));
        const unrotatedY = cy + (dx * Math.sin(rad) + dy * Math.cos(rad));

        return L.point(unrotatedX, unrotatedY);
      };
    }

    const onTileLoad = () => {
      applyMapRotation(map, rotationRef.current);
    };
    map.on("tileload", onTileLoad);
    map.on("zoomend", onTileLoad);
    map.on("moveend", onTileLoad);

    return () => {
      map.off("tileload", onTileLoad);
      map.off("zoomend", onTileLoad);
      map.off("moveend", onTileLoad);
    };
  }, [map]);

  // 3. Two-finger touch rotation gestures
  useEffect(() => {
    const container = map.getContainer();
    let isRotating = false;
    let initialTouchAngle = 0;
    let initialMapRotation = 0;

    function getTouchAngle(t1: Touch, t2: Touch): number {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        isRotating = true;
        initialTouchAngle = getTouchAngle(e.touches[0], e.touches[1]);
        initialMapRotation = rotationRef.current;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (isRotating && e.touches.length === 2) {
        const currentTouchAngle = getTouchAngle(e.touches[0], e.touches[1]);
        const delta = currentTouchAngle - initialTouchAngle;
        const newAngle = Math.round((initialMapRotation + delta + 360) % 360);

        if (Math.abs(newAngle - rotationRef.current) >= 1) {
          rotationRef.current = newAngle;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any)._mapRotationAngle = newAngle;
          applyMapRotation(map, newAngle);
          setRotationAngle(newAngle);
        }
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) {
        isRotating = false;
      }
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [map, setRotationAngle]);

  return null;
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
  setMapRotation: React.Dispatch<React.SetStateAction<number>>;
}

function MapViewController({
  userLocation,
  shouldCenter,
  setShouldCenter,
  navStep,
  isFollowingUser,
  setIsFollowingUser,
  fusedHeading,
  setMapRotation,
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
      setMapRotation(0); // Restore North-up on exit
    }
  }, [navStep, destinationTarget, userLocation, map, setIsFollowingUser, setMapRotation]);

  // Handle manual recenter / center button
  useEffect(() => {
    if (shouldCenter && userLocation) {
      setIsFollowingUser(true);
      const targetZoom = Math.max(map.getZoom(), 18);

      if (navStep === "OUTDOOR_NAV") {
        // Position camera with forward offset
        const forwardOffset = targetZoom >= 19 ? 18 : targetZoom >= 18 ? 24 : 32;
        const [targetLat, targetLng] = getForwardOffsetCoord(
          userLocation.lat,
          userLocation.lng,
          fusedHeading,
          forwardOffset
        );
        map.flyTo([targetLat, targetLng], targetZoom, { animate: true, duration: 0.8 });
        setMapRotation(Math.round(-fusedHeading));
      } else {
        map.flyTo([userLocation.lat, userLocation.lng], targetZoom, { animate: true, duration: 0.8 });
      }

      setShouldCenter(false);
    }
  }, [shouldCenter, userLocation, map, setShouldCenter, setIsFollowingUser, navStep, fusedHeading, setMapRotation]);

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

  // Live Course-Up Navigation: Pan camera ahead and rotate map to match fused heading
  useEffect(() => {
    if (navStep === "OUTDOOR_NAV" && userLocation && isFollowingUser) {
      const now = Date.now();
      const lastPos = lastPanPosRef.current;
      const elapsed = now - lastPanTimeRef.current;

      const dist = lastPos
        ? calculateDistanceInMeters(userLocation.lat, userLocation.lng, lastPos.lat, lastPos.lng)
        : Infinity;

      // Update map rotation course-up
      setMapRotation(Math.round(-fusedHeading));

      // Smooth camera follow with forward perspective offset (~20-30m)
      if (lastPos === null || dist >= 2.0 || elapsed >= 350) {
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
          duration: 0.35,
          easeLinearity: 0.4,
        });
      }
    } else if (navStep !== "OUTDOOR_NAV") {
      lastPanPosRef.current = null;
    }
  }, [navStep, userLocation, isFollowingUser, fusedHeading, map, setMapRotation]);

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

  // Heading fusion (Device compass + GPS course with circular EMA smoothing)
  const {
    heading: fusedHeading,
    source: headingSource,
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
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(true);

  // Runtime Navigation Debug Logging
  useEffect(() => {
    if (navStep === "OUTDOOR_NAV") {
      console.log("[NAV DEBUG]", {
        navStep,
        fusedHeading,
        headingSource,
        gpsHeading: userPosition?.heading,
        speed: userPosition?.speed,
        mapRotation,
        isFollowingUser,
      });
    }
  }, [navStep, fusedHeading, headingSource, userPosition, mapRotation, isFollowingUser]);

  // Request compass permissions on navigation initiation (iOS requirement)
  const handleStartNavWithPermission = useCallback(
    (params: Parameters<typeof startOutdoorNavigation>[0]) => {
      requestCompassPermission();
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
      className={className ?? "relative h-full w-full overflow-hidden bg-slate-950"}
      style={{ height: "100%", width: "100%", minHeight: "350px" }}
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
        <MapRotationController
          rotationAngle={mapRotation}
          setRotationAngle={setMapRotation}
        />
        <MapViewController
          userLocation={userLocation}
          shouldCenter={shouldCenterLocation}
          setShouldCenter={setShouldCenterLocation}
          navStep={navStep}
          isFollowingUser={isFollowingUser}
          setIsFollowingUser={setIsFollowingUser}
          fusedHeading={fusedHeading}
          setMapRotation={setMapRotation}
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
      </MapContainer>

      {/* On-Screen Navigation Debug HUD */}
      {navStep === "OUTDOOR_NAV" && (
        <div className="fixed top-2 left-2 z-[9999] pointer-events-none rounded-xl bg-black/90 px-3 py-2 font-mono text-[11px] text-emerald-400 border border-emerald-500/50 shadow-2xl backdrop-blur-md space-y-0.5 select-none">
          <div className="font-bold text-white flex items-center justify-between gap-3">
            <span>NAV HUD</span>
            <span className={isFollowingUser ? "text-emerald-400" : "text-amber-400 font-bold"}>
              FOLLOW: {isFollowingUser ? "ON" : "OFF"}
            </span>
          </div>
          <div>HEADING: <span className="font-bold text-white">{fusedHeading}°</span> ({headingSource.toUpperCase()})</div>
          <div>SPEED: <span className="font-bold text-white">{userPosition?.speed != null ? `${userPosition.speed.toFixed(2)} m/s` : "0 m/s"}</span></div>
          <div>ROTATION: <span className="font-bold text-white">{mapRotation}°</span></div>
        </div>
      )}

      {/* Floating Recenter Pill (shown when user manually panned during active navigation) */}
      {navStep === "OUTDOOR_NAV" && !isFollowingUser && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
          <button
            onClick={() => {
              setShouldCenterLocation(true);
              requestCompassPermission();
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
        rotationAngle={mapRotation}
        onResetRotation={() => setMapRotation(0)}
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
