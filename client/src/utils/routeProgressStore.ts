import { RouteProgressTracker, type RouteProgress } from "./RouteProgressTracker";
import type { RouteResponse } from "@/api/roadNetwork.api";

/**
 * Holds the single `RouteProgressTracker` for the active route.
 *
 * Previously both `useOutdoorRoute` and `useTurnByTurnNavigation` built their own
 * tracker and called `update()` on every GPS fix, doubling the projection maths and
 * letting the two copies drift apart. `update()` also ran inside a `useMemo`, so
 * StrictMode's double-invoked render advanced the monotonic progress state twice per
 * fix. There is only ever one active route, so it lives here instead — mutated from
 * an effect, read by subscription.
 */
class RouteProgressStore {
  private tracker: RouteProgressTracker | null = null;
  private nodeDistances: Map<string, number> = new Map();
  private progress: RouteProgress | null = null;
  private totalDistance = 0;
  // Bumped only when the tracker is rebuilt, so consumers can memoise per-route
  // derived data without recomputing it on every GPS fix.
  private routeVersion = 0;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Cached snapshot — safe to use directly as a `useSyncExternalStore` getter. */
  getProgress = (): RouteProgress | null => this.progress;

  getNodeDistances = (): Map<string, number> => this.nodeDistances;

  getTotalDistance = (): number => this.totalDistance;

  getRouteVersion = (): number => this.routeVersion;

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  /**
   * Rebuild the tracker for a new route, optionally anchored at the user's position.
   * Also precomputes each path node's distance along the route in one pass.
   */
  setRoute(route: RouteResponse | null, anchor?: { lat: number; lng: number }): void {
    if (!route || route.coordinates.length < 2) {
      this.reset();
      return;
    }

    this.tracker = new RouteProgressTracker(route.coordinates, anchor);
    this.totalDistance = this.tracker.getTotalDistance();
    this.nodeDistances = route.pathNodes
      ? this.tracker.buildNodeDistanceIndex(route.pathNodes)
      : new Map();
    this.progress = anchor ? this.tracker.update(anchor.lat, anchor.lng) : null;
    this.routeVersion += 1;
    this.notify();
  }

  /** Advance progress for a new GPS fix. Returns null when no route is active. */
  update(lat: number, lng: number): RouteProgress | null {
    if (!this.tracker) return null;
    this.progress = this.tracker.update(lat, lng);
    this.notify();
    return this.progress;
  }

  reset(): void {
    this.tracker = null;
    this.nodeDistances = new Map();
    this.progress = null;
    this.totalDistance = 0;
    this.routeVersion += 1;
    this.notify();
  }
}

export const routeProgressStore = new RouteProgressStore();
