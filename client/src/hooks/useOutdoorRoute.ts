import { useEffect, useRef, useCallback } from "react";
import { roadNetworkApi } from "@/api/roadNetwork.api";
import { useAppStore } from "@/store";
import { calculateDistanceInMeters } from "@/utils/geo";

// Distance threshold (meters) from last fetch position that triggers a reroute
const REROUTE_THRESHOLD_METERS = 15;
// Cross-track distance threshold (meters) from active route polyline that triggers instant reroute
const OFF_ROUTE_THRESHOLD_METERS = 12;
// Minimum milliseconds between consecutive route fetches (debounce)
const REROUTE_DEBOUNCE_MS = 2000;

function distanceToSegment(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  const dLat = bLat - aLat;
  const dLng = bLng - aLng;
  if (dLat === 0 && dLng === 0) {
    return calculateDistanceInMeters(pLat, pLng, aLat, aLng);
  }
  let t = ((pLat - aLat) * dLat + (pLng - aLng) * dLng) / (dLat * dLat + dLng * dLng);
  t = Math.max(0, Math.min(1, t));
  const projLat = aLat + t * dLat;
  const projLng = aLng + t * dLng;
  return calculateDistanceInMeters(pLat, pLng, projLat, projLng);
}

function minDistanceToPolyline(lat: number, lng: number, polyline: [number, number][]): number {
  if (polyline.length < 2) return Infinity;
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distanceToSegment(
      lat, lng,
      polyline[i][0], polyline[i][1],
      polyline[i + 1][0], polyline[i + 1][1]
    );
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Fetches the outdoor A* route from the server when navigation is active.
 * Automatically re-fetches (reroutes) when the user moves off-route or
 * strays more than REROUTE_THRESHOLD_METERS away from the last fetch position.
 * Results are written directly into the global store via `setActiveRoute`.
 */
export function useOutdoorRoute() {
  const {
    navStep,
    userLocation,
    destinationTarget,
    activeRoute,
    setActiveRoute,
  } = useAppStore();

  const lastFetchPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchRoute = useCallback(
    async (fromLat: number, fromLng: number) => {
      if (!destinationTarget) return;
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        const route = await roadNetworkApi.calculateRoute({
          startLat: fromLat,
          startLng: fromLng,
          ...(destinationTarget.roadNodeId
            ? { destNodeId: destinationTarget.roadNodeId }
            : {
                destLat: destinationTarget.latitude,
                destLng: destinationTarget.longitude,
              }),
        });

        if (isMountedRef.current) {
          setActiveRoute(route);
          lastFetchPosRef.current = { lat: fromLat, lng: fromLng };
          lastFetchTimeRef.current = Date.now();
        }
      } catch (err) {
        // Silently fail — WalkingRoutePolyline will keep showing last known route
        console.warn("[useOutdoorRoute] Route fetch failed:", err);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [destinationTarget, setActiveRoute]
  );

  useEffect(() => {
    // Only run while outdoor navigation is active
    if (navStep !== "OUTDOOR_NAV" || !userLocation || !destinationTarget) return;

    const { lat, lng } = userLocation;
    const now = Date.now();
    const lastPos = lastFetchPosRef.current;

    // Determine if we need a fresh fetch
    const neverFetched = lastPos === null;
    const debouncePassed = now - lastFetchTimeRef.current > REROUTE_DEBOUNCE_MS;

    const movedEnough =
      lastPos !== null &&
      calculateDistanceInMeters(lat, lng, lastPos.lat, lastPos.lng) >
        REROUTE_THRESHOLD_METERS;

    // Cross-track off-route detection
    const activeCoords = activeRoute?.coordinates ?? [];
    const isOffRoute =
      activeCoords.length >= 2 &&
      minDistanceToPolyline(lat, lng, activeCoords) > OFF_ROUTE_THRESHOLD_METERS;

    if (neverFetched || (debouncePassed && (movedEnough || isOffRoute))) {
      fetchRoute(lat, lng);
    }
  }, [navStep, userLocation, destinationTarget, activeRoute, fetchRoute]);

  // When navigation ends, reset tracking refs
  useEffect(() => {
    if (navStep === "IDLE") {
      lastFetchPosRef.current = null;
      lastFetchTimeRef.current = 0;
    }
  }, [navStep]);
}

