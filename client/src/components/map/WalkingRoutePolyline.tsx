import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import { getCampusRoadPath } from "@/utils/campusRoads";
import { roadNetworkApi } from "@/api/roadNetwork.api";

interface WalkingRoutePolylineProps {
  userLocation: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  destNodeId?: string | null;
  onRouteCalculated?: (distMeters: number, minutes: number) => void;
}

export function WalkingRoutePolyline({
  userLocation,
  destination,
  destNodeId,
  onRouteCalculated,
}: WalkingRoutePolylineProps) {
  const [apiPositions, setApiPositions] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!userLocation || (!destination && !destNodeId)) return;

    let isMounted = true;

    roadNetworkApi
      .calculateRoute({
        startLat: userLocation.lat,
        startLng: userLocation.lng,
        ...(destNodeId ? { destNodeId } : destination ? { destLat: destination.lat, destLng: destination.lng } : {}),
      })
      .then((res) => {
        if (isMounted && res.coordinates && res.coordinates.length > 0) {
          setApiPositions(res.coordinates);
          if (onRouteCalculated) {
            onRouteCalculated(res.totalDistanceMeters, res.estimatedWalkingMinutes);
          }
        }
      })
      .catch((err) => {
        // Fallback to local A* graph if backend API unavailable
        console.warn("Backend A* route fallback:", err?.message);
      });

    return () => {
      isMounted = false;
    };
  }, [userLocation?.lat, userLocation?.lng, destination?.lat, destination?.lng, destNodeId, onRouteCalculated]);

  if (
    !userLocation ||
    !destination ||
    isNaN(userLocation.lat) ||
    isNaN(userLocation.lng) ||
    isNaN(destination.lat) ||
    isNaN(destination.lng)
  ) {
    return null;
  }

  // Use API A* calculated positions or fallback to campus roads Dijkstra path
  const positions =
    apiPositions && apiPositions.length > 0
      ? apiPositions
      : getCampusRoadPath(
          userLocation.lat,
          userLocation.lng,
          destination.lat,
          destination.lng
        );

  return (
    <>
      {/* Outer cyan glow polyline */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: "#06b6d4",
          weight: 8,
          opacity: 0.4,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* Inner vibrant dashed polyline */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: "#22d3ee",
          weight: 5,
          opacity: 0.95,
          dashArray: "8, 6",
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </>
  );
}
