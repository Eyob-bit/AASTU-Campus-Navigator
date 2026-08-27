import { useState, useEffect, useRef, useCallback } from "react";

export interface UseHeadingFusionOptions {
  gpsHeading?: number | null;
  gpsSpeed?: number | null; // in m/s
  enabled?: boolean;
}

export interface UseHeadingFusionResult {
  /** Read the latest smoothed heading (0-360, clockwise from North) without subscribing to renders. */
  getHeading: () => number;
  /** Subscribe to heading changes. Returns an unsubscribe function. Never triggers a React render. */
  subscribeHeading: (listener: (heading: number) => void) => () => void;
  source: "gps" | "compass" | "none";
  isCalibrated: boolean;
  requestPermission: () => Promise<boolean>;
}

// Minimum angular change in degrees to trigger a listener notification (deadband)
const DEADBAND_DEGREES = 0.5;
// Smoothing factor for circular exponential moving average (0 < alpha <= 1)
const SMOOTHING_ALPHA = 0.25;
// Speed thresholds in m/s for GPS course vs compass hysteresis
const GPS_SPEED_ENTER_THRESHOLD_MPS = 1.2; // switch to GPS course when >= 1.2 m/s (~4.3 km/h)
const GPS_SPEED_EXIT_THRESHOLD_MPS = 0.8;  // drop back to compass when < 0.8 m/s (~2.9 km/h)
// Throttle listener notifications to ~10fps
const HEADING_NOTIFY_INTERVAL_MS = 100;
// `source` is surfaced through React state, so only commit it when it actually flips
// (not on every heading tick) to keep this hook off the hot render path.

/**
 * Calculates the shortest angular delta between two angles (in degrees, range [-180, +180]).
 */
function shortestAngleDelta(target: number, current: number): number {
  return ((target - current + 540) % 360) - 180;
}

/**
 * Fuses the device compass with GPS course into a single smoothed heading.
 *
 * The heading is deliberately NOT exposed as React state: it changes ~10x/second, and
 * anything holding it in state re-renders its whole subtree at that rate. Consumers
 * subscribe instead and apply the value imperatively (e.g. rotating a map marker).
 */
export function useHeadingFusion({
  gpsHeading = null,
  gpsSpeed = null,
  enabled = true,
}: UseHeadingFusionOptions = {}): UseHeadingFusionResult {
  const [source, setSource] = useState<"gps" | "compass" | "none">("none");
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const currentHeadingRef = useRef<number>(0);
  const rawCompassRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isGpsPreferredRef = useRef<boolean>(false);
  const gpsHeadingRef = useRef<number | null>(gpsHeading);
  const gpsSpeedRef = useRef<number | null>(gpsSpeed);
  const lastNotifyRef = useRef<number>(0);
  const sourceRef = useRef<"gps" | "compass" | "none">("none");
  const isCalibratedRef = useRef<boolean>(false);
  const listenersRef = useRef<Set<(heading: number) => void>>(new Set());

  // Sync props into refs so the rAF loop reads latest values without restarting
  useEffect(() => {
    gpsHeadingRef.current = gpsHeading;
    gpsSpeedRef.current = gpsSpeed;
  }, [gpsHeading, gpsSpeed]);

  const getHeading = useCallback(() => currentHeadingRef.current, []);

  const subscribeHeading = useCallback((listener: (heading: number) => void) => {
    listenersRef.current.add(listener);
    // Push the current value immediately so subscribers start correctly oriented.
    listener(currentHeadingRef.current);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  // Request DeviceOrientation permission for iOS 13+
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DeviceOrientation = window.DeviceOrientationEvent as any;
    if (DeviceOrientation && typeof DeviceOrientation.requestPermission === "function") {
      try {
        const res = await DeviceOrientation.requestPermission();
        return res === "granted";
      } catch {
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
        // Android / standard: compensate for screen orientation if device is tilted/rotated
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const screenAngle = Number((window.screen?.orientation as any)?.angle || (window as any).orientation || 0);
        compassAngle = (360 - e.alpha + screenAngle) % 360;
      }

      if (compassAngle !== null) {
        rawCompassRef.current = compassAngle;
        // Only commit calibration state once, on the first valid reading.
        if (!isCalibratedRef.current) {
          isCalibratedRef.current = true;
          setIsCalibrated(true);
        }
      }
    }

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
      const speed = gpsSpeedRef.current ?? 0;
      const gps = gpsHeadingRef.current;

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

          const now = performance.now();
          if (now - lastNotifyRef.current >= HEADING_NOTIFY_INTERVAL_MS) {
            lastNotifyRef.current = now;
            const rounded = Math.round(smoothed * 100) / 100;
            for (const listener of listenersRef.current) {
              listener(rounded);
            }
          }
        }

        // Commit `source` to React state only when it actually changes.
        if (activeSource !== sourceRef.current) {
          sourceRef.current = activeSource;
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
  }, [enabled]); // GPS values accessed via refs to avoid rAF loop restart

  return {
    getHeading,
    subscribeHeading,
    source,
    isCalibrated,
    requestPermission,
  };
}
