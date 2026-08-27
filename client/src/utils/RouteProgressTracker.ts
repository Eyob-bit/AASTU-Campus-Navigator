import { fastDistanceInMeters } from "./geo";
import type { RouteNodeInfo } from "@/api/roadNetwork.api";

export interface RouteProgress {
  segmentIndex: number;
  fractionAlongSegment: number;
  distanceAlongRoute: number;
  crossTrackDistance: number;
  snappedPosition: [number, number];
  isOffRoute: boolean;
}

export const OFF_ROUTE_THRESHOLD_METERS = 15;
export const MAX_LOOKAHEAD_SEGMENTS = 3;
export const JITTER_BACKWARD_TOLERANCE_METERS = 3.0;

const DEG_TO_RAD = Math.PI / 180;

/**
 * Helper to project a GPS coordinate onto a segment A -> B.
 * Uses equirectangular approximation scaled for local latitude.
 */
export function projectPointOnSegment(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): { t: number; projLat: number; projLng: number; crossTrackMeters: number } {
  const dLat = bLat - aLat;
  const dLngRaw = bLng - aLng;

  if (Math.abs(dLat) < 1e-9 && Math.abs(dLngRaw) < 1e-9) {
    const dist = fastDistanceInMeters(pLat, pLng, aLat, aLng);
    return { t: 0, projLat: aLat, projLng: aLng, crossTrackMeters: dist };
  }

  const cosLat = Math.cos(((aLat + bLat) / 2) * DEG_TO_RAD);

  const dLng = dLngRaw * cosLat;
  const pDeltaLat = pLat - aLat;
  const pDeltaLng = (pLng - aLng) * cosLat;

  const segmentLengthSquared = dLat * dLat + dLng * dLng;
  let t = (pDeltaLat * dLat + pDeltaLng * dLng) / segmentLengthSquared;
  t = Math.max(0, Math.min(1, t));

  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);
  const crossTrackMeters = fastDistanceInMeters(pLat, pLng, projLat, projLng);

  return { t, projLat, projLng, crossTrackMeters };
}

export class RouteProgressTracker {
  private polyline: [number, number][];
  private segmentDistances: number[] = [];
  private cumulativeDistances: number[] = [];
  private totalDistance: number = 0;

  private currentSegmentIndex: number = 0;
  private distanceAlongRoute: number = 0;
  private crossTrackDistance: number = 0;
  private snappedPosition: [number, number] = [0, 0];
  private fractionAlongSegment: number = 0;

  constructor(polyline: [number, number][], initialPosition?: { lat: number; lng: number }) {
    this.polyline = polyline;
    this.computeCumulativeDistances();

    if (this.polyline.length > 0) {
      this.snappedPosition = [this.polyline[0][0], this.polyline[0][1]];
    }

    if (initialPosition && polyline.length >= 2) {
      this.initializeAtPosition(initialPosition.lat, initialPosition.lng);
    }
  }

  private computeCumulativeDistances() {
    this.segmentDistances = [];
    this.cumulativeDistances = [0];
    this.totalDistance = 0;

    for (let i = 0; i < this.polyline.length - 1; i++) {
      const p1 = this.polyline[i];
      const p2 = this.polyline[i + 1];
      const dist = fastDistanceInMeters(p1[0], p1[1], p2[0], p2[1]);
      this.segmentDistances.push(dist);
      this.totalDistance += dist;
      this.cumulativeDistances.push(this.totalDistance);
    }
  }

  private initializeAtPosition(lat: number, lng: number) {
    if (this.polyline.length < 2) return;

    let bestDist = Infinity;
    let bestSeg = 0;
    let bestT = 0;
    let bestProj: [number, number] = [this.polyline[0][0], this.polyline[0][1]];

    for (let i = 0; i < this.polyline.length - 1; i++) {
      const a = this.polyline[i];
      const b = this.polyline[i + 1];
      const { t, projLat, projLng, crossTrackMeters } = projectPointOnSegment(
        lat, lng,
        a[0], a[1],
        b[0], b[1]
      );
      if (crossTrackMeters < bestDist) {
        bestDist = crossTrackMeters;
        bestSeg = i;
        bestT = t;
        bestProj = [projLat, projLng];
      }
    }

    this.currentSegmentIndex = bestSeg;
    this.fractionAlongSegment = bestT;
    this.crossTrackDistance = bestDist;
    this.snappedPosition = bestProj;
    this.distanceAlongRoute =
      this.cumulativeDistances[bestSeg] + bestT * (this.segmentDistances[bestSeg] || 0);
  }

  /**
   * Update user GPS location and calculate progress along route.
   */
  public update(lat: number, lng: number): RouteProgress {
    if (this.polyline.length < 2) {
      return {
        segmentIndex: 0,
        fractionAlongSegment: 0,
        distanceAlongRoute: 0,
        crossTrackDistance: 0,
        snappedPosition: this.polyline[0] || [lat, lng],
        isOffRoute: false,
      };
    }

    // 1. Forward-looking window check [currentSegmentIndex, currentSegmentIndex + MAX_LOOKAHEAD_SEGMENTS]
    const maxSegIdx = this.polyline.length - 2;
    const startIdx = this.currentSegmentIndex;
    const endIdx = Math.min(maxSegIdx, this.currentSegmentIndex + MAX_LOOKAHEAD_SEGMENTS);

    let bestWindowDist = Infinity;
    let bestWindowSeg = this.currentSegmentIndex;
    let bestWindowT = 0;
    let bestWindowProj: [number, number] = this.snappedPosition;

    for (let i = startIdx; i <= endIdx; i++) {
      const a = this.polyline[i];
      const b = this.polyline[i + 1];
      const { t, projLat, projLng, crossTrackMeters } = projectPointOnSegment(
        lat, lng,
        a[0], a[1],
        b[0], b[1]
      );

      // Slight forward bias: favor progress if distance is virtually equal
      if (crossTrackMeters <= bestWindowDist) {
        bestWindowDist = crossTrackMeters;
        bestWindowSeg = i;
        bestWindowT = t;
        bestWindowProj = [projLat, projLng];
      }
    }

    // If within off-route threshold in forward window, track progress monotonically forward
    if (bestWindowDist <= OFF_ROUTE_THRESHOLD_METERS) {
      this.currentSegmentIndex = bestWindowSeg;
      this.fractionAlongSegment = bestWindowT;
      this.crossTrackDistance = bestWindowDist;
      this.snappedPosition = bestWindowProj;

      const calculatedDist =
        this.cumulativeDistances[bestWindowSeg] +
        bestWindowT * (this.segmentDistances[bestWindowSeg] || 0);

      // Suppress minor backward GPS jitter (< 3m), but advance steadily
      if (calculatedDist >= this.distanceAlongRoute - JITTER_BACKWARD_TOLERANCE_METERS) {
        this.distanceAlongRoute = Math.max(this.distanceAlongRoute, calculatedDist);
      }

      return {
        segmentIndex: this.currentSegmentIndex,
        fractionAlongSegment: this.fractionAlongSegment,
        distanceAlongRoute: this.distanceAlongRoute,
        crossTrackDistance: this.crossTrackDistance,
        snappedPosition: this.snappedPosition,
        isOffRoute: false,
      };
    }

    // 2. Fallback: Full polyline scan (checks if user turned around or is elsewhere on route)
    let bestFullDist = Infinity;
    let bestFullSeg = 0;
    let bestFullT = 0;
    let bestFullProj: [number, number] = [this.polyline[0][0], this.polyline[0][1]];

    for (let i = 0; i <= maxSegIdx; i++) {
      const a = this.polyline[i];
      const b = this.polyline[i + 1];
      const { t, projLat, projLng, crossTrackMeters } = projectPointOnSegment(
        lat, lng,
        a[0], a[1],
        b[0], b[1]
      );

      if (crossTrackMeters < bestFullDist) {
        bestFullDist = crossTrackMeters;
        bestFullSeg = i;
        bestFullT = t;
        bestFullProj = [projLat, projLng];
      }
    }

    if (bestFullDist <= OFF_ROUTE_THRESHOLD_METERS) {
      // User is on the route (e.g. turned around or took a shortcut)
      this.currentSegmentIndex = bestFullSeg;
      this.fractionAlongSegment = bestFullT;
      this.crossTrackDistance = bestFullDist;
      this.snappedPosition = bestFullProj;
      this.distanceAlongRoute =
        this.cumulativeDistances[bestFullSeg] +
        bestFullT * (this.segmentDistances[bestFullSeg] || 0);

      return {
        segmentIndex: this.currentSegmentIndex,
        fractionAlongSegment: this.fractionAlongSegment,
        distanceAlongRoute: this.distanceAlongRoute,
        crossTrackDistance: this.crossTrackDistance,
        snappedPosition: this.snappedPosition,
        isOffRoute: false,
      };
    }

    // 3. User is genuinely off-route (> 15m away from all segments)
    this.crossTrackDistance = bestFullDist;
    return {
      segmentIndex: this.currentSegmentIndex,
      fractionAlongSegment: this.fractionAlongSegment,
      distanceAlongRoute: this.distanceAlongRoute,
      crossTrackDistance: bestFullDist,
      snappedPosition: bestFullProj,
      isOffRoute: true,
    };
  }

  /**
   * Find cumulative distance along polyline for a target latitude/longitude coordinate.
   */
  public getDistanceAlongRouteForCoordinate(targetLat: number, targetLng: number): number {
    if (this.polyline.length < 2) return 0;

    let bestDist = Infinity;
    let bestSeg = 0;
    let bestT = 0;

    for (let i = 0; i < this.polyline.length - 1; i++) {
      const a = this.polyline[i];
      const b = this.polyline[i + 1];
      const { t, crossTrackMeters } = projectPointOnSegment(
        targetLat, targetLng,
        a[0], a[1],
        b[0], b[1]
      );
      if (crossTrackMeters < bestDist) {
        bestDist = crossTrackMeters;
        bestSeg = i;
        bestT = t;
      }
    }

    return this.cumulativeDistances[bestSeg] + bestT * (this.segmentDistances[bestSeg] || 0);
  }

  /**
   * Find cumulative distance along polyline for a path node ID.
   */
  public getDistanceAlongRouteForNodeId(
    nodeId: string,
    pathNodes: RouteNodeInfo[]
  ): number | null {
    const node = pathNodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return this.getDistanceAlongRouteForCoordinate(node.latitude, node.longitude);
  }

  /**
   * Map every path node to its cumulative distance along the route in a single pass.
   *
   * Resolving nodes one at a time costs a full polyline scan each — O(nodes × segments)
   * — which is why this walks both lists together instead. Path nodes appear along the
   * polyline in order, so the segment cursor only ever moves forward.
   */
  public buildNodeDistanceIndex(pathNodes: RouteNodeInfo[]): Map<string, number> {
    const index = new Map<string, number>();
    if (this.polyline.length < 2) return index;

    const maxSegIdx = this.polyline.length - 2;
    let cursor = 0;

    for (const node of pathNodes) {
      let bestDist = Infinity;
      let bestSeg = cursor;
      let bestT = 0;

      for (let i = cursor; i <= maxSegIdx; i++) {
        const a = this.polyline[i];
        const b = this.polyline[i + 1];
        const { t, crossTrackMeters } = projectPointOnSegment(
          node.latitude, node.longitude,
          a[0], a[1],
          b[0], b[1]
        );

        if (crossTrackMeters < bestDist) {
          bestDist = crossTrackMeters;
          bestSeg = i;
          bestT = t;
          // A node sitting essentially on a vertex is an exact match; stop looking.
          if (bestDist < 0.5) break;
        }
      }

      index.set(
        node.id,
        this.cumulativeDistances[bestSeg] + bestT * (this.segmentDistances[bestSeg] || 0)
      );
      cursor = bestSeg;
    }

    return index;
  }

  public getTotalDistance(): number {
    return this.totalDistance;
  }

  public getDistanceAlongRoute(): number {
    return this.distanceAlongRoute;
  }

  public getCurrentSegmentIndex(): number {
    return this.currentSegmentIndex;
  }
}
