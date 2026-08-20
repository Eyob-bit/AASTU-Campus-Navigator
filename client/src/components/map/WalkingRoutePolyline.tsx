import { useEffect, useMemo } from "react";
import type { GeoJSONSource } from "maplibre-gl";
import { useMapInstance } from "./MapLibreContainer";

interface WalkingRoutePolylineProps {
  positions: [number, number][]; // [lat, lng]
}

const SOURCE_ID = "walking-route-source";
const LAYER_CASING = "walking-route-casing";
const LAYER_GLOW = "walking-route-glow";
const LAYER_CORE = "walking-route-core";

export function WalkingRoutePolyline({ positions }: WalkingRoutePolylineProps) {
  const map = useMapInstance();

  // Convert [lat, lng] → GeoJSON [lng, lat] LineString
  const geojson: GeoJSON.Feature<GeoJSON.LineString> = useMemo(() => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: positions.map(([lat, lng]) => [Number(lng), Number(lat)]),
    },
  }), [positions]);

  // ── Source & Layers lifecycle with dynamic data updates and style switch support ──
  useEffect(() => {
    if (!map) return;

    function applyData() {
      if (!map) return;
      if (positions.length < 2) return;

      try {
        const existingSource = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        if (existingSource) {
          existingSource.setData(geojson);
        } else {
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: geojson,
          });

          // 1. High-contrast dark casing outline (separates bright cyan from satellite terrain)
          if (!map.getLayer(LAYER_CASING)) {
            map.addLayer({
              id: LAYER_CASING,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#020617",
                "line-width": 10,
                "line-opacity": 0.9,
              },
            });
          }

          // 2. Cyan neon aura glow
          if (!map.getLayer(LAYER_GLOW)) {
            map.addLayer({
              id: LAYER_GLOW,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#06b6d4",
                "line-width": 7,
                "line-opacity": 0.7,
                "line-blur": 2,
              },
            });
          }

          // 3. Crisp vivid foreground route line
          if (!map.getLayer(LAYER_CORE)) {
            map.addLayer({
              id: LAYER_CORE,
              type: "line",
              source: SOURCE_ID,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": "#22d3ee",
                "line-width": 4,
                "line-opacity": 1.0,
              },
            });
          }
        }
      } catch (_) {
        // If style is still loading during tile switch, style.load will fire and call applyData
      }
    }

    applyData();
    map.on("style.load", applyData);
    map.on("styledata", applyData);

    return () => {
      map.off("style.load", applyData);
      map.off("styledata", applyData);
    };
  }, [map, geojson, positions.length]);

  return null;
}

