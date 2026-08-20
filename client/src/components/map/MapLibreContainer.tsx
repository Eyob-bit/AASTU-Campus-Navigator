import { useEffect, useRef, useState, createContext, useContext, type ReactNode } from "react";
import { Map, AttributionControl, type LngLatBoundsLike, type MapMouseEvent } from "maplibre-gl";
import { getMapStyle, type TileMode, AASTU_CENTER_LNG_LAT, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, CAMPUS_BOUNDS_LNG_LAT } from "./mapConfig";

const MapContext = createContext<Map | null>(null);

export function useMapInstance(): Map | null {
  return useContext(MapContext);
}

interface MapLibreContainerProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  pitch?: number;
  bearing?: number;
  maxBounds?: LngLatBoundsLike;
  tileMode?: TileMode;
  className?: string;
  onMapReady?: (map: Map) => void;
  onClick?: (e: MapMouseEvent) => void;
  children?: ReactNode;
}

export function MapLibreContainer({
  center = AASTU_CENTER_LNG_LAT,
  zoom = DEFAULT_ZOOM,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
  pitch = 0,
  bearing = 0,
  maxBounds = CAMPUS_BOUNDS_LNG_LAT,
  tileMode = "street",
  className = "h-full w-full",
  onMapReady,
  onClick,
  children,
}: MapLibreContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  // Track whether the map-ready callback has already been dispatched so that
  // StrictMode's double-invoke doesn't call setMapInstance twice with the same instance.
  const readyFiredRef = useRef(false);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const onClickRef = useRef(onClick);

  useEffect(() => { onMapReadyRef.current = onMapReady; }, [onMapReady]);
  useEffect(() => { onClickRef.current = onClick; }, [onClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    function handleReady(loadedMap: Map) {
      if (readyFiredRef.current) return; // Guard: only fire once per mount
      readyFiredRef.current = true;
      setMapInstance(loadedMap);
      if (onMapReadyRef.current) {
        onMapReadyRef.current(loadedMap);
      }
    }

    // If map instance was already created for this container, reuse it across StrictMode cycles.
    // Reset the guard so the second (real) mount can fire handleReady.
    if (mapRef.current) {
      readyFiredRef.current = false;
      const existing = mapRef.current;
      (window as any).__debugMap = existing;
      if (existing.loaded()) {
        handleReady(existing);
      } else {
        existing.once("load", () => handleReady(existing));
      }
      return;
    }

    const map = new Map({
      container: containerRef.current,
      style: getMapStyle(tileMode),
      center,
      zoom,
      minZoom,
      maxZoom,
      pitch,
      bearing,
      maxBounds,
      attributionControl: false,
    });

    mapRef.current = map;
    (window as any).__debugMap = map;

    map.addControl(new AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      handleReady(map);
    });

    map.on("click", (e: MapMouseEvent) => {
      if (onClickRef.current) {
        onClickRef.current(e);
      }
    });

    // Resize observer to ensure full container fit
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      // We intentionally preserve the map instance during StrictMode's synthetic double-mount
      // to avoid aborting in-flight Web Workers in MapLibre's shared GeoJSON worker pool.
    };
  // Intentionally run map creation only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle tileMode style updates dynamically
  const prevTileModeRef = useRef(tileMode);
  useEffect(() => {
    if (!mapInstance) return;
    if (prevTileModeRef.current !== tileMode) {
      prevTileModeRef.current = tileMode;
      const newStyle = getMapStyle(tileMode);
      mapInstance.setStyle(newStyle);
    }
  }, [mapInstance, tileMode]);

  return (
    <div ref={containerRef} className={className}>
      <MapContext.Provider value={mapInstance}>
        {mapInstance && children}
      </MapContext.Provider>
    </div>
  );
}
