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
  const geojson: GeoJSON.Feature<GeoJSON.LineString> = useMemo(
    () => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: positions.map(([lat, lng]) => [Number(lng), Number(lat)]),
      },
    }),
    [positions]
  );

  // 1. Setup Source & Layers once on mount & cleanup on unmount
  useEffect(() => {
    if (!map) return;

    function setupLayers() {
      if (!map) return;
      try {
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: geojson,
          });
        }

        // 1. High-contrast dark casing outline
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
      } catch (_) {}
    }

    setupLayers();
    map.on("style.load", setupLayers);

    return () => {
      map.off("style.load", setupLayers);
      try {
        if (map.getLayer(LAYER_CORE)) map.removeLayer(LAYER_CORE);
        if (map.getLayer(LAYER_GLOW)) map.removeLayer(LAYER_GLOW);
        if (map.getLayer(LAYER_CASING)) map.removeLayer(LAYER_CASING);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch (_) {}
    };
  }, [map]);

  // 2. Update line data smoothly whenever geojson changes
  useEffect(() => {
    if (!map) return;
    try {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (source) {
        source.setData(geojson);
      }
    } catch (_) {}
  }, [map, geojson]);

  return null;
}



