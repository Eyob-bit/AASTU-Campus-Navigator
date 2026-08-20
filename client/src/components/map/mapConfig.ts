import type { StyleSpecification } from "maplibre-gl";

// ── Tile mode type ────────────────────────────────────────────────────────────
export type TileMode = "street" | "satellite";

export const TILE_LAYERS = {
  street: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics",
    maxNativeZoom: 20,
  },
} as const;

// ── AASTU Campus Constants ───────────────────────────────────────────────────
export const AASTU_CENTER: [number, number] = [8.8885, 38.809]; // [lat, lng] legacy format
export const AASTU_CENTER_LNG_LAT: [number, number] = [38.809, 8.8885]; // MapLibre [lng, lat]
export const DEFAULT_ZOOM = 16;
export const MIN_ZOOM = 11;
export const MAX_ZOOM = 24;

/**
 * AASTU Campus Boundary Polygon coordinates as [lat, lng].
 */
export const AASTU_CAMPUS_BOUNDARY: [number, number][] = [
  [8.880353, 38.791507],
  [8.883323, 38.791918],
  [8.883953, 38.792144],
  [8.884421, 38.792560],
  [8.884906, 38.793222],
  [8.886335, 38.795112],
  [8.888778, 38.798321],
  [8.890374, 38.800477],
  [8.889177, 38.801386],
  [8.888301, 38.802028],
  [8.887646, 38.802662],
  [8.888365, 38.803686],
  [8.889035, 38.804631],
  [8.890089, 38.803765],
  [8.890851, 38.803109],
  [8.891030, 38.803015],
  [8.891770, 38.802395],
  [8.896291, 38.808329],
  [8.886951, 38.813606],
  [8.882515, 38.815819],
  [8.882272, 38.815363],
  [8.882030, 38.815032],
  [8.881981, 38.814829],
  [8.881641, 38.814569],
  [8.881433, 38.813852],
  [8.881273, 38.813283],
  [8.881023, 38.813065],
  [8.881398, 38.811744],
  [8.881544, 38.810747],
  [8.881384, 38.810550],
  [8.881259, 38.809159],
  [8.881217, 38.808511],
  [8.880870, 38.808286],
  [8.881030, 38.807378],
  [8.881530, 38.806125],
  [8.881412, 38.805555],
  [8.882086, 38.804591],
  [8.881336, 38.802825],
  [8.882156, 38.800685],
  [8.881530, 38.799404],
  [8.881127, 38.799538],
  [8.881141, 38.798454],
  [8.880640, 38.797448],
  [8.882017, 38.796547],
  [8.882184, 38.795794],
  [8.881280, 38.793823],
  [8.881085, 38.792549],
];

/**
 * GeoJSON Feature representation of AASTU Campus Boundary Polygon [lng, lat].
 */
export const AASTU_CAMPUS_BOUNDARY_GEOJSON: {
  type: "Feature";
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
  properties: Record<string, unknown>;
} = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [AASTU_CAMPUS_BOUNDARY.map(([lat, lng]) => [lng, lat])],
  },
};

/**
 * MapLibre max bounds as [[minLng, minLat], [maxLng, maxLat]]
 */
export const CAMPUS_BOUNDS_LNG_LAT: [[number, number], [number, number]] = [
  [38.77, 8.855], // SW corner
  [38.84, 8.92],  // NE corner
];

/**
 * Creates MapLibre GL style object for raster street or satellite tiles.
 */
export function getMapStyle(tileMode: TileMode): StyleSpecification {
  const isSatellite = tileMode === "satellite";
  const tileUrl = isSatellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  return {
    version: 8,
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: isSatellite
          ? "&copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics"
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxzoom: isSatellite ? 17 : 18,
      },
    },
    layers: [
      {
        id: "raster-tiles-layer",
        type: "raster",
        source: "raster-tiles",
        minzoom: 0,
        maxzoom: 24,
      },
    ],
  };
}
