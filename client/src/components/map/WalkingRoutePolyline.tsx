import { useEffect, useMemo } from "react";
import { useGoogleMapInstance } from "./GoogleMapsContainer";

interface WalkingRoutePolylineProps {
  positions: [number, number][]; // [lat, lng]
}

export function WalkingRoutePolyline({ positions }: WalkingRoutePolylineProps) {
  const map = useGoogleMapInstance();

  const path = useMemo(
    () =>
      positions.map(([lat, lng]) => ({
        lat: Number(lat),
        lng: Number(lng),
      })),
    [positions]
  );

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps || path.length < 2) return;

    // ── Google Maps–style route: thin white casing + vivid blue core ──

    // 1. White border/casing (like Google Maps route outline)
    const casing = new google.maps.Polyline({
      path,
      strokeColor: "#FFFFFF",
      strokeWeight: 6,
      strokeOpacity: 1.0,
      zIndex: 1,
      map,
    });

    // 2. Google-blue vivid route line on top
    const core = new google.maps.Polyline({
      path,
      strokeColor: "#4285F4",
      strokeWeight: 4,
      strokeOpacity: 1.0,
      zIndex: 2,
      map,
    });

    return () => {
      casing.setMap(null);
      core.setMap(null);
    };
  }, [map, path]);

  return null;
}