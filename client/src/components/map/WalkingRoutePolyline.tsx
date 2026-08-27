import { useEffect, useMemo, useRef } from "react";
import { useGoogleMapInstance } from "./GoogleMapsContainer";

interface WalkingRoutePolylineProps {
  positions: [number, number][]; // [lat, lng]
}

/**
 * Google Maps–style walking route: thin white casing beneath a vivid blue core.
 *
 * Both polylines are constructed once and updated via `setPath`. Recreating them on
 * every GPS tick (the route head follows the user, so the path changes ~2x/second)
 * is what made the route line visibly blink.
 */
export function WalkingRoutePolyline({ positions }: WalkingRoutePolylineProps) {
  const map = useGoogleMapInstance();
  const casingRef = useRef<google.maps.Polyline | null>(null);
  const coreRef = useRef<google.maps.Polyline | null>(null);

  const path = useMemo(
    () =>
      positions.map(([lat, lng]) => ({
        lat: Number(lat),
        lng: Number(lng),
      })),
    [positions]
  );

  const pathRef = useRef(path);
  pathRef.current = path;

  // ── Create both polylines once per map instance ────────────────────────────
  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps) return;

    const initialPath = pathRef.current.length >= 2 ? pathRef.current : [];

    // 1. White border/casing (like Google Maps route outline)
    const casing = new google.maps.Polyline({
      path: initialPath,
      strokeColor: "#FFFFFF",
      strokeWeight: 6,
      strokeOpacity: 1.0,
      zIndex: 1,
      map,
    });

    // 2. Google-blue vivid route line on top
    const core = new google.maps.Polyline({
      path: initialPath,
      strokeColor: "#4285F4",
      strokeWeight: 4,
      strokeOpacity: 1.0,
      zIndex: 2,
      map,
    });

    casingRef.current = casing;
    coreRef.current = core;

    return () => {
      casing.setMap(null);
      core.setMap(null);
      casingRef.current = null;
      coreRef.current = null;
    };
  }, [map]);

  // ── Push new geometry without tearing the overlays down ────────────────────
  useEffect(() => {
    const casing = casingRef.current;
    const core = coreRef.current;
    if (!casing || !core) return;

    const hasRoute = path.length >= 2;
    const nextPath = hasRoute ? path : [];

    casing.setPath(nextPath);
    core.setPath(nextPath);
    casing.setVisible(hasRoute);
    core.setVisible(hasRoute);
  }, [path]);

  return null;
}
