import { useEffect, useRef, useCallback } from "react";
import { roadNetworkApi } from "@/api/roadNetwork.api";
import { useAppStore } from "@/store";
import { RouteProgressTracker } from "@/utils";

// Minimum milliseconds between consecutive route fetches (debounce)
const REROUTE_DEBOUNCE_MS = 3000;
// Number of consecutive off-route GPS fixes required to trigger A* reroute
const REQUIRED_CONSECUTIVE_OFF_ROUTE_COUNT = 3;

/**
 * Fetches the outdoor A* route from the server when outdoor navigation is active.
 * Only re-fetches (reroutes) when the user sustains off-route movement or target changes.
 * Tracks monotonic progress along the route and prevents GPS jitter from jumping backward.
 */
export function useOutdoorRoute() {
  const {
    navStep,
    userLocation,
    destinationTarget,
    activeRoute,
    setActiveRoute,
    setCurrentInstructionIndex,
  } = useAppStore();

  const lastFetchPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);
  const trackerRef = useRef<RouteProgressTracker | null>(null);
  const consecutiveOffRouteCountRef = useRef<number>(0);

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

  // Update or initialize tracker when activeRoute changes
  useEffect(() => {
    if (activeRoute && activeRoute.coordinates.length >= 2) {
      trackerRef.current = new RouteProgressTracker(
        activeRoute.coordinates,
        userLocation || undefined
      );
      consecutiveOffRouteCountRef.current = 0;
    } else {
      trackerRef.current = null;
    }
  }, [activeRoute]);

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
          // Reset navigation state atomically for the new route
          setActiveRoute(route);
          setCurrentInstructionIndex(0);
          lastFetchPosRef.current = { lat: fromLat, lng: fromLng };
          lastFetchTimeRef.current = Date.now();
          consecutiveOffRouteCountRef.current = 0;

          // Initialize tracker anchored at the current GPS position
          trackerRef.current = new RouteProgressTracker(route.coordinates, {
            lat: fromLat,
            lng: fromLng,
          });
        }
      } catch (err) {
        console.warn("[useOutdoorRoute] Route fetch failed:", err);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          isFetchingRef.current = false;
        }
      }
    },
    [destinationTarget, setActiveRoute, setCurrentInstructionIndex]
  );

  useEffect(() => {
    // Only run while outdoor navigation is active
    if (navStep !== "OUTDOOR_NAV" || !userLocation || !destinationTarget) return;

    const { lat, lng } = userLocation;
    const now = Date.now();
    const lastPos = lastFetchPosRef.current;

    const neverFetched = lastPos === null;
    const debouncePassed = now - lastFetchTimeRef.current > REROUTE_DEBOUNCE_MS;

    if (neverFetched) {
      fetchRoute(lat, lng);
      return;
    }

    // Check off-route using RouteProgressTracker
    if (trackerRef.current) {
      const progress = trackerRef.current.update(lat, lng);

      if (progress.isOffRoute) {
        consecutiveOffRouteCountRef.current += 1;
      } else {
        consecutiveOffRouteCountRef.current = 0;
      }

      // Reroute if user sustained off-route position for multiple consecutive readings
      if (
        debouncePassed &&
        consecutiveOffRouteCountRef.current >= REQUIRED_CONSECUTIVE_OFF_ROUTE_COUNT
      ) {
        fetchRoute(lat, lng);
      }
    }
  }, [navStep, userLocation, destinationTarget, fetchRoute]);

  // When navigation ends or destination changes, reset tracking refs
  useEffect(() => {
    if (navStep === "IDLE") {
      lastFetchPosRef.current = null;
      lastFetchTimeRef.current = 0;
      consecutiveOffRouteCountRef.current = 0;
      trackerRef.current = null;
    }
  }, [navStep]);
}
