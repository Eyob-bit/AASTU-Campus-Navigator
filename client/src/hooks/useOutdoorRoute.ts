import { useEffect, useRef, useCallback } from "react";
import { roadNetworkApi } from "@/api/roadNetwork.api";
import { useAppStore } from "@/store";
import { calculateDistanceInMeters } from "@/utils/geo";

// Cross-track distance threshold (meters) from active route polyline that triggers reroute
const OFF_ROUTE_THRESHOLD_METERS = 15;
// Minimum milliseconds between consecutive route fetches (debounce)
const REROUTE_DEBOUNCE_MS = 3000;

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

/**
  * Fast off-route check:
  * First tests segments near the user's current progress index (window of ~5 segments).
  * Only performs a full polyline scan if local window distance > threshold.
  */
function isUserOffRoute(
  lat: number,
  lng: number,
  polyline: [number, number][],
  lastSegIdxRef: React.MutableRefObject<number>
): boolean {
  if (polyline.length < 2) return false;

  const startIdx = Math.max(0, lastSegIdxRef.current - 1);
  const endIdx = Math.min(polyline.length - 1, lastSegIdxRef.current + 4);

  let minWindowDist = Infinity;
  let bestSegIdx = lastSegIdxRef.current;

  for (let i = startIdx; i < endIdx; i++) {
    const d = distanceToSegment(
      lat, lng,
      polyline[i][0], polyline[i][1],
      polyline[i + 1][0], polyline[i + 1][1]
    );
    if (d < minWindowDist) {
      minWindowDist = d;
      bestSegIdx = i;
    }
  }

  if (minWindowDist <= OFF_ROUTE_THRESHOLD_METERS) {
    lastSegIdxRef.current = bestSegIdx;
    return false;
  }

  // Fallback: full polyline search only when window check exceeds threshold
  let minFullDist = Infinity;
  let fullBestIdx = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distanceToSegment(
      lat, lng,
      polyline[i][0], polyline[i][1],
      polyline[i + 1][0], polyline[i + 1][1]
    );
    if (d < minFullDist) {
      minFullDist = d;
      fullBestIdx = i;
    }
  }

  if (minFullDist <= OFF_ROUTE_THRESHOLD_METERS) {
    lastSegIdxRef.current = fullBestIdx;
    return false;
  }

  return true; // User has genuinely moved off-route
}

/**
 * Fetches the outdoor A* route from the server when outdoor navigation is active.
 * Only re-fetches (reroutes) when the user moves off-route or target changes.
 * Avoids recalculating A* for every GPS step while walking correctly on route.
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
  const requestIdRef = useRef<number>(0);
  const lastSegIdxRef = useRef<number>(0);

  // Keep a ref to activeRoute to avoid activeRoute in effect dependency array
  const activeRouteRef = useRef(activeRoute);
  useEffect(() => {
    activeRouteRef.current = activeRoute;
  }, [activeRoute]);

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

      const currentRequestId = ++requestIdRef.current;
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

        // Stale response guard: only update if this is still the latest request
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setActiveRoute(route);
          lastFetchPosRef.current = { lat: fromLat, lng: fromLng };
          lastFetchTimeRef.current = Date.now();
          lastSegIdxRef.current = 0;
        }
      } catch (err) {
        console.warn("[useOutdoorRoute] Route fetch failed:", err);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          isFetchingRef.current = false;
        }
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

    const neverFetched = lastPos === null;
    const debouncePassed = now - lastFetchTimeRef.current > REROUTE_DEBOUNCE_MS;

    // Check off-route status using fast segment-window search
    const currentCoords = activeRouteRef.current?.coordinates ?? [];
    const offRoute =
      currentCoords.length >= 2 &&
      isUserOffRoute(lat, lng, currentCoords, lastSegIdxRef);

    if (neverFetched || (debouncePassed && offRoute)) {
      fetchRoute(lat, lng);
    }
  }, [navStep, userLocation, destinationTarget, fetchRoute]);

  // When navigation ends or destination changes, reset tracking refs
  useEffect(() => {
    if (navStep === "IDLE") {
      lastFetchPosRef.current = null;
      lastFetchTimeRef.current = 0;
      lastSegIdxRef.current = 0;
    }
  }, [navStep]);
}


