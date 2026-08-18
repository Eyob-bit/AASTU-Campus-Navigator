import { useState, useEffect, useRef, useCallback } from "react";

export interface UseHeadingFusionOptions {
  gpsHeading?: number | null;
  gpsSpeed?: number | null; // in m/s
  enabled?: boolean;
}

export interface UseHeadingFusionResult {
  heading: number; // Smoothed 0-360 degrees clockwise from North
  source: "gps" | "compass" | "none";
  isCalibrated: boolean;
  requestPermission: () => Promise<boolean>;
}

// Minimum angular change in degrees to trigger re-render (deadband)
const DEADBAND_DEGREES = 1.2;
// Smoothing factor for circular exponential moving average (0 < alpha <= 1)
const SMOOTHING_ALPHA = 0.18;
// Speed thresholds in m/s for GPS course vs compass hysteresis
const GPS_SPEED_ENTER_THRESHOLD_MPS = 1.2; // switch to GPS course when >= 1.2 m/s (~4.3 km/h)
const GPS_SPEED_EXIT_THRESHOLD_MPS = 0.8;  // drop back to compass when < 0.8 m/s (~2.9 km/h)

/**
 * Calculates the shortest angular delta between two angles (in degrees, range [-180, +180]).
 */
function shortestAngleDelta(target: number, current: number): number {
  return ((target - current + 540) % 360) - 180;
}

export function useHeadingFusion({
  gpsHeading = null,
  gpsSpeed = null,
  enabled = true,
}: UseHeadingFusionOptions = {}): UseHeadingFusionResult {
  const [heading, setHeading] = useState<number>(0);
  const [source, setSource] = useState<"gps" | "compass" | "none">("none");
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const currentHeadingRef = useRef<number>(0);
  const rawCompassRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isGpsPreferredRef = useRef<boolean>(false);

  // Request DeviceOrientation permission for iOS 13+
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DeviceOrientation = window.DeviceOrientationEvent as any;
    if (DeviceOrientation && typeof DeviceOrientation.requestPermission === "function") {
      try {
        const res = await DeviceOrientation.requestPermission();
        return res === "granted";
      } catch (err) {
        console.warn("[useHeadingFusion] iOS orientation permission error:", err);
        return false;
      }
    }
    return true;
  }, []);

  // Listen to device orientation (Compass)
  useEffect(() => {
    if (!enabled) return;

    function handleOrientation(e: DeviceOrientationEvent) {
      let compassAngle: number | null = null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eAny = e as any;
      if (typeof eAny.webkitCompassHeading === "number" && !isNaN(eAny.webkitCompassHeading)) {
        // iOS provides true compass heading directly (0° = North, clockwise)
        compassAngle = eAny.webkitCompassHeading;
      } else if (e.alpha !== null && !isNaN(e.alpha)) {
        // Android / standard: alpha is rotation around z-axis (0-360 counter-clockwise)
        compassAngle = (360 - e.alpha) % 360;
      }

      if (compassAngle !== null) {
        rawCompassRef.current = compassAngle;
        setIsCalibrated(true);
      }
    }

    // Use absolute orientation if supported on modern Chrome/Android, fallback to regular
    const hasAbsolute = typeof window !== "undefined" && "ondeviceorientationabsolute" in window;
    const eventName = hasAbsolute ? "deviceorientationabsolute" : "deviceorientation";

    (window as unknown as EventTarget).addEventListener(
      eventName,
      handleOrientation as EventListener,
      true
    );

    return () => {
      (window as unknown as EventTarget).removeEventListener(
        eventName,
        handleOrientation as EventListener,
        true
      );
    };
  }, [enabled]);

  // Heading Fusion & Circular EMA Ticker
  useEffect(() => {
    if (!enabled) return;

    let isRunning = true;

    function tick() {
      if (!isRunning) return;

      const compass = rawCompassRef.current;
      const speed = gpsSpeed ?? 0;
      const gps = gpsHeading;

      let targetHeading: number | null = null;
      let activeSource: "gps" | "compass" | "none" = "none";

      const hasValidGps = gps !== null && !isNaN(gps) && gps >= 0;

      // Hysteresis: enter GPS mode at >= 1.2 m/s, exit when falling below 0.8 m/s
      if (isGpsPreferredRef.current) {
        if (!hasValidGps || speed < GPS_SPEED_EXIT_THRESHOLD_MPS) {
          isGpsPreferredRef.current = false;
        }
      } else {
        if (hasValidGps && speed >= GPS_SPEED_ENTER_THRESHOLD_MPS) {
          isGpsPreferredRef.current = true;
        }
      }

      if (isGpsPreferredRef.current && hasValidGps) {
        targetHeading = gps;
        activeSource = "gps";
      } else if (compass !== null && !isNaN(compass)) {
        targetHeading = compass;
        activeSource = "compass";
      } else if (hasValidGps) {
        targetHeading = gps;
        activeSource = "gps";
      }

      if (targetHeading !== null) {
        const current = currentHeadingRef.current;
        const delta = shortestAngleDelta(targetHeading, current);

        if (Math.abs(delta) >= DEADBAND_DEGREES) {
          const smoothed = (current + SMOOTHING_ALPHA * delta + 360) % 360;
          currentHeadingRef.current = smoothed;
          setHeading(Math.round(smoothed * 10) / 10);
          setSource(activeSource);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    }

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enabled, gpsHeading, gpsSpeed]);

  return {
    heading,
    source,
    isCalibrated,
    requestPermission,
  };
}
