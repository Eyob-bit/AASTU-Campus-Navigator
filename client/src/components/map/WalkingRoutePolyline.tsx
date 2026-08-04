import { Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";

interface WalkingRoutePolylineProps {
  positions: [number, number][];
}

function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function createArrowIcon(angle: number) {
  return L.divIcon({
    className: "route-direction-arrow",
    html: `<div style="transform: rotate(${angle}deg); display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: rgba(11,19,43,0.85); border: 1px solid #06b6d4; border-radius: 50%; box-shadow: 0 0 8px rgba(6,182,212,0.6);">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/**
 * Pure rendering component — draws the A* route polyline returned by the server,
 * along with directional arrows along each segment.
 */
export function WalkingRoutePolyline({ positions }: WalkingRoutePolylineProps) {
  if (positions.length < 2) return null;

  // Calculate segment midpoints and bearings for directional arrows
  const segmentArrows = useMemo(() => {
    const arrows: { pos: [number, number]; bearing: number; key: string }[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const [lat1, lng1] = positions[i];
      const [lat2, lng2] = positions[i + 1];
      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const bearing = getBearing(lat1, lng1, lat2, lng2);
      arrows.push({
        pos: [midLat, midLng],
        bearing,
        key: `arrow-${i}-${lat1.toFixed(5)}-${lng1.toFixed(5)}`,
      });
    }
    return arrows;
  }, [positions]);

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
      {/* Direction arrows along segments */}
      {segmentArrows.map((arrow) => (
        <Marker
          key={arrow.key}
          position={arrow.pos}
          icon={createArrowIcon(arrow.bearing)}
          interactive={false}
        />
      ))}
    </>
  );
}

