import { useEffect, useMemo } from "react";
import { useGoogleMapInstance } from "./GoogleMapsContainer";
import { AASTU_CAMPUS_BOUNDARY } from "./mapConfig";

interface CampusBoundaryPolygonProps {
  interactive?: boolean;
}

export function CampusBoundaryPolygon({ interactive = false }: CampusBoundaryPolygonProps) {
  const map = useGoogleMapInstance();

  const paths = useMemo(
    () =>
      AASTU_CAMPUS_BOUNDARY.map(([lat, lng]) => ({
        lat: Number(lat),
        lng: Number(lng),
      })),
    []
  );

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps) return;

    const polygon = new google.maps.Polygon({
      paths,
      strokeColor: "#FACC15",
      strokeWeight: 3.5,
      strokeOpacity: 0.85,
      fillColor: "#FEF08A",
      fillOpacity: 0.08,
      clickable: interactive,
      map,
    });

    return () => {
      polygon.setMap(null);
    };
  }, [map, paths, interactive]);

  return null;
}