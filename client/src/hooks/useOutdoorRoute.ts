import { useEffect, useRef, useCallback } from "react";
import { roadNetworkApi } from "@/api/roadNetwork.api";
import { useAppStore } from "@/store";
import { calculateDistanceInMeters } from "@/utils/geo";

// Distance threshold (meters) from last fetch position that triggers a reroute
const REROUTE_THRESHOLD_METERS = 25;
// Minimum milliseconds between consecutive route fetches (debounce)
const REROUTE_DEBOUNCE_MS = 8000;

/**
 * Fetches the outdoor A* route from the server when navigation is active.
 * Automatically re-fetches (reroutes) when the user moves more than
 * REROUTE_THRESHOLD_METERS away from the position of the last successful fetch.
 * Results are written directly into the global store via `setActiveRoute`.
 */
export function useOutdoorRoute() {
  const {
    navStep,
    userLocation,
    destinationTarget,
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

    if (neverFetched || (debouncePassed && movedEnough)) {
      fetchRoute(lat, lng);
    }
  }, [navStep, userLocation, destinationTarget, fetchRoute]);

  // When navigation ends, reset tracking refs
  useEffect(() => {
    if (navStep === "IDLE") {
      lastFetchPosRef.current = null;
      lastFetchTimeRef.current = 0;
    }
  }, [navStep]);
}
