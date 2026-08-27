import { useEffect, useRef } from "react";
import { useGoogleMapInstance } from "./GoogleMapsContainer";

interface UserLocationMarkerProps {
  lat: number;
  lng: number;
  isNavigating?: boolean;
  isCourseUp?: boolean;
  accuracy?: number;
  /**
   * Subscribe to smoothed heading updates. Rotation is applied imperatively so a
   * ~10Hz heading stream never re-renders React.
   */
  subscribeHeading?: (listener: (heading: number) => void) => () => void;
}

// Arrow glyph pointing north at rotation 0, centred on its own origin.
const ARROW_PATH = "M 0 -11 L 7.5 9 L 0 4.5 L -7.5 9 Z";
// Only push a new icon once the heading has moved this far, in degrees.
const ROTATION_QUANTUM_DEGREES = 3;

const CYAN = "#06B6D4";
const WHITE = "#FFFFFF";

function haloIcon(isNavigating: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: isNavigating ? 18 : 16,
    fillColor: CYAN,
    fillOpacity: 0.25,
    strokeColor: isNavigating ? WHITE : CYAN,
    strokeWeight: isNavigating ? 1.5 : 1,
  };
}

function coreIcon(isNavigating: boolean, rotation: number): google.maps.Symbol {
  if (isNavigating) {
    return {
      path: ARROW_PATH,
      scale: 1.2,
      rotation,
      fillColor: CYAN,
      fillOpacity: 1,
      strokeColor: WHITE,
      strokeWeight: 2.5,
    };
  }
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: CYAN,
    fillOpacity: 1,
    strokeColor: WHITE,
    strokeWeight: 2.5,
  };
}

/**
 * Renders the user's GPS position as a halo + core marker pair, plus an accuracy circle.
 *
 * All three overlays are constructed once and then mutated in place. Recreating a
 * `google.maps.Marker` on every position or heading tick is what makes the map stutter,
 * so nothing here is torn down until the component unmounts.
 */
export function UserLocationMarker({
  lat,
  lng,
  isNavigating = false,
  accuracy,
  subscribeHeading,
}: UserLocationMarkerProps) {
  const map = useGoogleMapInstance();
  const haloRef = useRef<google.maps.Marker | null>(null);
  const coreRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Latest applied rotation, and the navigating flag as seen by the heading listener.
  const rotationRef = useRef<number>(0);
  const isNavigatingRef = useRef<boolean>(isNavigating);
  const accuracyRef = useRef<number | undefined>(accuracy);

  isNavigatingRef.current = isNavigating;
  accuracyRef.current = accuracy;

  const hasValidPosition = !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);

  // ── Create overlays once per map instance ──────────────────────────────────
  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps) return;

    const position = { lat, lng };
    const currentAccuracy =
      accuracyRef.current != null && accuracyRef.current > 0 ? accuracyRef.current : null;

    const halo = new google.maps.Marker({
      position,
      map,
      clickable: false,
      zIndex: 998,
      icon: haloIcon(isNavigatingRef.current),
    });

    const core = new google.maps.Marker({
      position,
      map,
      title: "Your Location",
      zIndex: 999,
      icon: coreIcon(isNavigatingRef.current, rotationRef.current),
    });

    const circle = new google.maps.Circle({
      map,
      center: position,
      radius: currentAccuracy ?? 0,
      clickable: false,
      fillColor: CYAN,
      fillOpacity: 0.1,
      strokeColor: CYAN,
      strokeOpacity: 0.5,
      strokeWeight: 1,
      visible: currentAccuracy !== null,
    });

    haloRef.current = halo;
    coreRef.current = core;
    circleRef.current = circle;

    return () => {
      halo.setMap(null);
      core.setMap(null);
      circle.setMap(null);
      haloRef.current = null;
      coreRef.current = null;
      circleRef.current = null;
    };
    // Position/heading/accuracy are applied by the effects below, so they are
    // deliberately excluded here — including them would recreate the overlays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // ── Position ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasValidPosition) return;
    const position = { lat, lng };
    haloRef.current?.setPosition(position);
    coreRef.current?.setPosition(position);
    circleRef.current?.setCenter(position);
  }, [lat, lng, hasValidPosition]);

  // ── Visibility (hide everything until we have a real fix) ──────────────────
  useEffect(() => {
    haloRef.current?.setVisible(hasValidPosition);
    coreRef.current?.setVisible(hasValidPosition);
  }, [hasValidPosition]);

  // ── Navigating / idle appearance ───────────────────────────────────────────
  useEffect(() => {
    haloRef.current?.setIcon(haloIcon(isNavigating));
    coreRef.current?.setIcon(coreIcon(isNavigating, rotationRef.current));
  }, [isNavigating]);

  // ── Accuracy circle ───────────────────────────────────────────────────────
  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;

    if (hasValidPosition && accuracy != null && accuracy > 0) {
      circle.setRadius(accuracy);
      circle.setVisible(true);
    } else {
      circle.setVisible(false);
    }
  }, [accuracy, hasValidPosition]);

  // ── Heading → rotation, applied imperatively ──────────────────────────────
  useEffect(() => {
    if (!subscribeHeading) return;

    return subscribeHeading((heading) => {
      // Skip sub-quantum jitter: setIcon is cheap but not free, and the rotation
      // is imperceptible below a few degrees.
      if (Math.abs(heading - rotationRef.current) < ROTATION_QUANTUM_DEGREES) return;

      rotationRef.current = heading;
      if (isNavigatingRef.current) {
        coreRef.current?.setIcon(coreIcon(true, heading));
      }
    });
  }, [subscribeHeading]);

  return null;
}
