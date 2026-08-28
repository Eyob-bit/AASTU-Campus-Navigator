import { useState, useEffect, useCallback, useRef } from "react";
import { fastDistanceInMeters, calculateDistanceInMeters } from "@/utils/geo";

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface UseLiveNavigationOptions {
  targetLat?: number | null;
  targetLng?: number | null;
  arrivalThresholdMeters?: number;
  enabled?: boolean;
  /**
   * Request high-accuracy fixes. Meaningfully more battery and CPU, so enable it only
   * while actively navigating.
   */
  highAccuracy?: boolean;
  onArrival?: () => void;
}

export interface UseLiveNavigationResult {
  userPosition: GPSPosition | null;
  distanceToTargetMeters: number | null;
  isArrived: boolean;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

// Max allowed GPS accuracy radius in meters before considering reading suspicious (if previous location is already accurate)
const MAX_ACCURACY_THRESHOLD_METERS = 100;
// Minimum position change in meters required to trigger state update (suppresses stationary jitter)
const MIN_POSITION_CHANGE_METERS = 1.0;

export function useLiveNavigation({
  targetLat,
  targetLng,
  arrivalThresholdMeters = 15,
  enabled = true,
  highAccuracy = true,
  onArrival,
}: UseLiveNavigationOptions = {}): UseLiveNavigationResult {
  const [userPosition, setUserPosition] = useState<GPSPosition | null>(null);
  const [distanceToTargetMeters, setDistanceToTargetMeters] = useState<number | null>(null);
  const [isArrived, setIsArrived] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const hasTriggeredArrivalRef = useRef<boolean>(false);
  const lastPosRef = useRef<GPSPosition | null>(null);
  const onArrivalRef = useRef(onArrival);

  useEffect(() => {
    onArrivalRef.current = onArrival;
  }, [onArrival]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    // Don't re-create watcher if already active
    if (watchIdRef.current !== null) return;

    setIsTracking(true);
    setError(null);
    hasTriggeredArrivalRef.current = false;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;

        // 1. Basic coordinate validation
        if (
          isNaN(latitude) ||
          isNaN(longitude) ||
          (latitude === 0 && longitude === 0)
        ) {
          return;
        }

        const prevPos = lastPosRef.current;

        // 2. Accuracy check: Allow update if previous fix was null, if accuracy is good (<=100m),
        //    if the new fix is more accurate than the old fix, or if the old fix itself had poor accuracy.
        if (prevPos !== null && accuracy != null) {
          const prevAccuracy = prevPos.accuracy ?? Infinity;
          const isNewAccuracyGood = accuracy <= MAX_ACCURACY_THRESHOLD_METERS;
          const isBetterThanPrev = accuracy < prevAccuracy;
          const wasPrevBad = prevAccuracy > MAX_ACCURACY_THRESHOLD_METERS;

          if (!isNewAccuracyGood && !isBetterThanPrev && !wasPrevBad) {
            return;
          }
        }

        // 3. Jitter filtering: If change is tiny (< 1.0m) and speed is zero/low, skip
        //    unnecessary render. Uses the unrounded metric — the rounded one snaps to
        //    whole metres and cannot resolve a 1.0m threshold.
        if (prevPos !== null) {
          const deltaMeters = fastDistanceInMeters(
            latitude,
            longitude,
            prevPos.latitude,
            prevPos.longitude
          );
          const currentSpeed = speed ?? 0;
          if (deltaMeters < MIN_POSITION_CHANGE_METERS && currentSpeed < 0.5) {
            return;
          }
        }

        const currentPos: GPSPosition = {
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
          timestamp: pos.timestamp || Date.now(),
        };

        lastPosRef.current = currentPos;
        setUserPosition(currentPos);
      },
      (err) => {
        setError(err.message || "Failed to retrieve GPS location.");
        setIsTracking(false);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: highAccuracy ? 1000 : 10000,
      }
    );
  }, [highAccuracy]);

  // Update distance to target and arrival locally whenever userPosition or target changes
  useEffect(() => {
    if (userPosition && targetLat != null && targetLng != null) {
      const dist = calculateDistanceInMeters(
        userPosition.latitude,
        userPosition.longitude,
        targetLat,
        targetLng
      );
      setDistanceToTargetMeters(dist);

      if (dist <= arrivalThresholdMeters && !hasTriggeredArrivalRef.current) {
        hasTriggeredArrivalRef.current = true;
        setIsArrived(true);
        if (onArrivalRef.current) {
          onArrivalRef.current();
        }
      }
    }
  }, [userPosition, targetLat, targetLng, arrivalThresholdMeters]);

  // (Re)start the watcher when enablement or accuracy mode changes.
  useEffect(() => {
    if (!enabled) {
      stopTracking();
      return;
    }

    // `startTracking` bails if a watcher is live, so tear down first to let an
    // accuracy-mode change take effect.
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    startTracking();

    return () => {
      stopTracking();
    };
  }, [enabled, highAccuracy, startTracking, stopTracking]);

  return {
    userPosition,
    distanceToTargetMeters,
    isArrived,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
}
