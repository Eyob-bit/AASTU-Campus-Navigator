import { useEffect, useRef, useCallback } from "react";
import { roadNetworkApi } from "@/api/roadNetwork.api";
import { useAppStore, useAppActions } from "@/store";
import { routeProgressStore } from "@/utils";

// Minimum milliseconds between consecutive route fetches (debounce)
const REROUTE_DEBOUNCE_MS = 3000;
// Number of consecutive off-route GPS fixes required to trigger A* reroute
const REQUIRED_CONSECUTIVE_OFF_ROUTE_COUNT = 3;

/**
 * Fetches the outdoor A* route from the server when outdoor navigation is active.
 * Only re-fetches (reroutes) when the user sustains off-route movement or target changes.
 *
 * This hook is the single owner of `routeProgressStore` updates — it advances progress
 * once per GPS fix and everything else reads from that shared tracker.
 */
export function useOutdoorRoute() {
  const navStep = useAppStore((s) => s.navStep);
  const userLocation = useAppStore((s) => s.userLocation);
  const destinationTarget = useAppStore((s) => s.destinationTarget);
  const activeRoute = useAppStore((s) => s.activeRoute);
  const { setActiveRoute, setCurrentInstructionIndex } = useAppActions();

  const lastFetchPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);
  const consecutiveOffRouteCountRef = useRef<number>(0);
  const userLocationRef = useRef(userLocation);
  // Position a freshly fetched route should be anchored at, handed to the effect below
  // so the tracker is rebuilt exactly once per route.
  const pendingAnchorRef = useRef<{ lat: number; lng: number } | null>(null);

  userLocationRef.current = userLocation;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Rebuild the shared tracker whenever the route geometry changes, anchored at the
  // position the route was requested from (or the latest fix, for externally set routes).
  useEffect(() => {
    const anchor = pendingAnchorRef.current ?? userLocationRef.current ?? undefined;
    pendingAnchorRef.current = null;
    routeProgressStore.setRoute(activeRoute, anchor);
    consecutiveOffRouteCountRef.current = 0;
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
          // Reset navigation state atomically for the new route. The tracker is rebuilt
          // by the effect above, anchored at the position this route was requested from.
          pendingAnchorRef.current = { lat: fromLat, lng: fromLng };
          setActiveRoute(route);
          setCurrentInstructionIndex(0);
          lastFetchPosRef.current = { lat: fromLat, lng: fromLng };
          lastFetchTimeRef.current = Date.now();
          consecutiveOffRouteCountRef.current = 0;
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

    if (lastFetchPosRef.current === null) {
      fetchRoute(lat, lng);
      return;
    }

    // Advance the shared tracker for this fix and check whether we've left the route.
    const progress = routeProgressStore.update(lat, lng);
    if (!progress) return;

    if (progress.isOffRoute) {
      consecutiveOffRouteCountRef.current += 1;
    } else {
      consecutiveOffRouteCountRef.current = 0;
    }

    // Reroute if user sustained off-route position for multiple consecutive readings
    if (
      now - lastFetchTimeRef.current > REROUTE_DEBOUNCE_MS &&
      consecutiveOffRouteCountRef.current >= REQUIRED_CONSECUTIVE_OFF_ROUTE_COUNT
    ) {
      fetchRoute(lat, lng);
    }
  }, [navStep, userLocation, destinationTarget, fetchRoute]);

  // When navigation ends, reset tracking refs and drop the tracker
  useEffect(() => {
    if (navStep === "IDLE") {
      lastFetchPosRef.current = null;
      lastFetchTimeRef.current = 0;
      consecutiveOffRouteCountRef.current = 0;
      routeProgressStore.reset();
    }
  }, [navStep]);
}
