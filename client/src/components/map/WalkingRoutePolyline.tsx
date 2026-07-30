import { Polyline } from "react-leaflet";

interface WalkingRoutePolylineProps {
  positions: [number, number][];
}

/**
 * Pure rendering component — draws the A* route polyline returned by the server.
 * Route data is computed externally (via useOutdoorRoute) and passed in as `positions`.
 */
export function WalkingRoutePolyline({ positions }: WalkingRoutePolylineProps) {
  if (positions.length < 2) return null;

  return (
    <>
      {/* Outer cyan glow */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: "#06b6d4",
          weight: 8,
          opacity: 0.35,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* Inner vibrant dashed line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: "#22d3ee",
          weight: 4,
          opacity: 0.95,
          dashArray: "10, 7",
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </>
  );
}
