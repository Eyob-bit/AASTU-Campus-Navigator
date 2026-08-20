import { useEffect, useMemo, useRef } from "react";
import { Marker, type GeoJSONSource } from "maplibre-gl";
import { useMapInstance } from "./MapLibreContainer";

interface WalkingRoutePolylineProps {
  positions: [number, number][]; // [lat, lng]
}

function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const SOURCE_ID = "walking-route-source";
const LAYER_OUTER = "walking-route-outer";
const LAYER_INNER = "walking-route-inner";

// Show one direction arrow every N segments to avoid clutter
const ARROW_EVERY_N = 4;

export function WalkingRoutePolyline({ positions }: WalkingRoutePolylineProps) {
  const map = useMapInstance();
  const arrowMarkersRef = useRef<Marker[]>([]);

  // Convert [lat, lng] → GeoJSON [lng, lat] LineString
  const geojson: GeoJSON.Feature<GeoJSON.LineString> = useMemo(() => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: positions.map(([lat, lng]) => [Number(lng), Number(lat)]),
    },
  }), [positions]);

  const geojsonRef = useRef(geojson);
  useEffect(() => {
    geojsonRef.current = geojson;
  }, [geojson]);

  // Sparse segment midpoint arrows (every Nth segment)
  const segmentArrows = useMemo(() => {
    if (positions.length < 2) return [];
    const arrows: { pos: [number, number]; bearing: number }[] = [];
    for (let i = 0; i < positions.length - 1; i += ARROW_EVERY_N) {
      const [lat1, lng1] = positions[i];
      const [lat2, lng2] = positions[i + 1];
      const midLat = (Number(lat1) + Number(lat2)) / 2;
      const midLng = (Number(lng1) + Number(lng2)) / 2;
      arrows.push({ pos: [midLng, midLat], bearing: getBearing(lat1, lng1, lat2, lng2) });
    }
    return arrows;
  }, [positions]);

  // ── Source & Layers lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    function initLayers() {
      if (!map) return;

      if (!map.isStyleLoaded()) {
        map.once("styledata", initLayers);
        return;
      }

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: geojsonRef.current,
        });

        // Outer casing border for high contrast
        if (!map.getLayer(LAYER_OUTER)) {
          map.addLayer({
            id: LAYER_OUTER,
            type: "line",
            source: SOURCE_ID,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#0284c7",
              "line-width": 10,
              "line-opacity": 0.8,
            },
          });
        }

        // Vibrant solid core route line
        if (!map.getLayer(LAYER_INNER)) {
          map.addLayer({
            id: LAYER_INNER,
            type: "line",
            source: SOURCE_ID,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#00f0ff",
              "line-width": 6,
              "line-opacity": 1.0,
            },
          });
        }
      } else {
        const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        if (source) {
          source.setData(geojsonRef.current);
        }
      }
    }

    initLayers();
    map.on("styledata", initLayers);

    return () => {
      map.off("styledata", initLayers);
      try {
        if (map.getLayer(LAYER_INNER)) map.removeLayer(LAYER_INNER);
        if (map.getLayer(LAYER_OUTER)) map.removeLayer(LAYER_OUTER);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch (_) {}
    };
  }, [map]);

  // ── Push updated coordinates into the source ─────────────────────────────────
  useEffect(() => {
    if (!map) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
    }
  }, [map, geojson]);

  // ── Render segment arrows ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    arrowMarkersRef.current.forEach((m) => m.remove());
    arrowMarkersRef.current = [];

    segmentArrows.forEach(({ pos, bearing }) => {
      const container = document.createElement("div");
      container.style.pointerEvents = "none";

      const icon = document.createElement("div");
      icon.style.cssText = [
        `transform: rotate(${Math.round(bearing)}deg)`,
        "transform-origin: center center",
        "display: flex",
        "align-items: center",
        "justify-content: center",
        "width: 20px",
        "height: 20px",
        "background: rgba(2, 6, 23, 0.92)",
        "border: 1.5px solid #22d3ee",
        "border-radius: 50%",
        "box-shadow: 0 0 8px rgba(6, 182, 212, 0.8), 0 2px 4px rgba(0,0,0,0.5)",
        "transition: transform 0.2s ease",
      ].join(";");

      icon.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke="#22d3ee" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="6 11 12 5 18 11"/>
      </svg>`;

      container.appendChild(icon);

      const marker = new Marker({ element: container, anchor: "center" })
        .setLngLat(pos)
        .addTo(map);

      arrowMarkersRef.current.push(marker);
    });

    return () => {
      arrowMarkersRef.current.forEach((m) => m.remove());
      arrowMarkersRef.current = [];
    };
  }, [map, segmentArrows]);

  return null;
}
