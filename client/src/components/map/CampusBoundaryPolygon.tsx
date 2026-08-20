import { useEffect } from "react";
import { useMapInstance } from "./MapLibreContainer";
import { AASTU_CAMPUS_BOUNDARY_GEOJSON } from "./mapConfig";

interface CampusBoundaryPolygonProps {
  interactive?: boolean;
}

const SOURCE_ID = "aastu-boundary-source";
const FILL_LAYER = "aastu-boundary-fill";
const CASING_LAYER = "aastu-boundary-casing";
const LINE_LAYER = "aastu-boundary-line";

export function CampusBoundaryPolygon({ interactive = false }: CampusBoundaryPolygonProps) {
  const map = useMapInstance();

  useEffect(() => {
    if (!map) return;

    function initLayers() {
      if (!map) return;

      try {
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: AASTU_CAMPUS_BOUNDARY_GEOJSON,
          });

          // 1. Semi-transparent campus interior fill
          if (!map.getLayer(FILL_LAYER)) {
            map.addLayer({
              id: FILL_LAYER,
              type: "fill",
              source: SOURCE_ID,
              paint: {
                "fill-color": "#FEF08A",
                "fill-opacity": 0.12,
              },
            });
          }

          // 2. High-contrast dark casing outline (ensures visibility over bright satellite terrain and street tiles)
          if (!map.getLayer(CASING_LAYER)) {
            map.addLayer({
              id: CASING_LAYER,
              type: "line",
              source: SOURCE_ID,
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": "#020617",
                "line-width": 6,
                "line-opacity": 0.8,
              },
            });
          }

          // 3. Vibrant golden-yellow boundary stroke
          if (!map.getLayer(LINE_LAYER)) {
            map.addLayer({
              id: LINE_LAYER,
              type: "line",
              source: SOURCE_ID,
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": "#FACC15",
                "line-width": 3.5,
                "line-opacity": 1.0,
              },
            });
          }
        }
      } catch (_) {
        // If style is still loading during switch, style.load will fire and call initLayers
      }
    }

    initLayers();
    map.on("style.load", initLayers);
    map.on("styledata", initLayers);

    return () => {
      map.off("style.load", initLayers);
      map.off("styledata", initLayers);
    };
  }, [map, interactive]);

  return null;
}
