import { useEffect, useRef } from "react";
import { useGoogleMapInstance } from "@/components/map";
import type { RoadEdge, RoadNode } from "@/api/roadNetwork.api";

interface RoadEdgesLayerProps {
  edges: RoadEdge[];
  nodeMap: Map<string, RoadNode>;
  selectedEdgeId: string | null;
  onSelectEdge: (edge: RoadEdge) => void;
}

export function RoadEdgesLayer({ edges, nodeMap, selectedEdgeId, onSelectEdge }: RoadEdgesLayerProps) {
  const map = useGoogleMapInstance();
  const onSelectEdgeRef = useRef(onSelectEdge);
  useEffect(() => {
    onSelectEdgeRef.current = onSelectEdge;
  }, [onSelectEdge]);

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps || edges.length === 0) return;

    const polylines: google.maps.Polyline[] = [];

    edges.forEach((edge) => {
      const u = edge.fromNode ?? nodeMap.get(edge.fromNodeId);
      const v = edge.toNode ?? nodeMap.get(edge.toNodeId);
      if (!u || !v) return;

      const isSelected = selectedEdgeId === edge.id;
      const poly = new google.maps.Polyline({
        path: [
          { lat: u.latitude, lng: u.longitude },
          { lat: v.latitude, lng: v.longitude },
        ],
        strokeColor: isSelected ? "#f59e0b" : "#22d3ee",
        strokeWeight: isSelected ? 6 : 4,
        strokeOpacity: 1.0,
        map,
      });

      poly.addListener("click", () => {
        onSelectEdgeRef.current(edge);
      });

      polylines.push(poly);
    });

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, edges, nodeMap, selectedEdgeId]);

  return null;
}