import { useState, useEffect, useCallback, useRef } from "react";
import { calculateDistanceInMeters } from "@/utils/geo";

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface UseLiveNavigationOptions {
  targetLat?: number | null;
  targetLng?: number | null;
  arrivalThresholdMeters?: number;
  enabled?: boolean;
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

export function useLiveNavigation({
  targetLat,
  targetLng,
  arrivalThresholdMeters = 15,
  enabled = true,
  onArrival,
}: UseLiveNavigationOptions = {}): UseLiveNavigationResult {
  const [userPosition, setUserPosition] = useState<GPSPosition | null>(null);
  const [distanceToTargetMeters, setDistanceToTargetMeters] = useState<number | null>(null);
  const [isArrived, setIsArrived] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const hasTriggeredArrivalRef = useRef<boolean>(false);
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

    stopTracking();
    setIsTracking(true);
    setError(null);
    hasTriggeredArrivalRef.current = false;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        const currentPos: GPSPosition = {
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
        };

        setUserPosition(currentPos);

        if (targetLat != null && targetLng != null) {
          const dist = calculateDistanceInMeters(latitude, longitude, targetLat, targetLng);
          setDistanceToTargetMeters(dist);

          if (dist <= arrivalThresholdMeters && !hasTriggeredArrivalRef.current) {
            hasTriggeredArrivalRef.current = true;
            setIsArrived(true);
            if (onArrivalRef.current) {
              onArrivalRef.current();
            }
          }
        }
      },
      (err) => {
        setError(err.message || "Failed to retrieve GPS location.");
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [targetLat, targetLng, arrivalThresholdMeters, stopTracking]);

  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, startTracking, stopTracking]);

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
