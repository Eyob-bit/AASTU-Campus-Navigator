import { Polygon } from "react-leaflet";
import { AASTU_CAMPUS_BOUNDARY } from "./mapConfig";

interface CampusBoundaryPolygonProps {
  interactive?: boolean;
}

/**
 * Renders the official AASTU Campus Boundary Polygon in vibrant yellow outline
 * matching the campus perimeter marked in yellow.
 */
export function CampusBoundaryPolygon({ interactive = false }: CampusBoundaryPolygonProps) {
  return (
    <Polygon
      positions={AASTU_CAMPUS_BOUNDARY}
      pathOptions={{
        color: "#FACC15",       // Yellow outline color matching screenshot
        weight: 3.5,            // Clean visible stroke width
        opacity: 0.95,
        fillColor: "#FEF08A",   // Light translucent yellow fill
        fillOpacity: 0.12,      // Subtle fill highlight
        lineCap: "round",
        lineJoin: "round",
      }}
      interactive={interactive}
    />
  );
}

