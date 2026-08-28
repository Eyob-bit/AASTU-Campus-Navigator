import {
  useEffect,
  useRef,
  useState,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  useJsApiLoader,
  GoogleMap,
} from "@react-google-maps/api";

const MapContext = createContext<google.maps.Map | null>(null);

export function useGoogleMapInstance(): google.maps.Map | null {
  return useContext(MapContext);
}

export function useMapsEventListener(
  target: any,
  eventName: string,
  handler: (...args: any[]) => void
) {
  useEffect(() => {
    if (!target) return;
    if (typeof target.addEventListener === "function") {
      target.addEventListener(eventName, handler);
      return () => target.removeEventListener(eventName, handler);
    }
    if (typeof google !== "undefined" && google.maps?.event?.addListener) {
      const listener = google.maps.event.addListener(target, eventName, handler);
      return () => {
        if (listener && typeof listener.remove === "function") {
          listener.remove();
        } else if (typeof google !== "undefined" && google.maps?.event?.removeListener) {
          google.maps.event.removeListener(listener);
        }
      };
    }
  }, [target, eventName, handler]);
}

interface GoogleMapsContainerProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  tileMode?: "street" | "satellite";
  className?: string;
  onMapReady?: (map: google.maps.Map) => void;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  children?: ReactNode;
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

export function GoogleMapsContainer({
  center = [8.8885, 38.809] as [number, number],
  zoom = 16,
  minZoom = 11,
  maxZoom = 24,
  tileMode = "street",
  className = "h-full w-full",
  onMapReady,
  onClick,
  children,
}: GoogleMapsContainerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof process !== "undefined" ? (process.env as any)?.REACT_APP_GOOGLE_MAPS_API_KEY : "") ||
    "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const googleCenter = useMemo(
    () => ({ lat: Number(center[0]), lng: Number(center[1]) }),
    [center[0], center[1]]
  );

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps) return;
    try {
      const targetType =
        tileMode === "satellite"
          ? google.maps.MapTypeId.HYBRID
          : google.maps.MapTypeId.ROADMAP;
      map.setMapTypeId(targetType);
    } catch (err) {
      console.warn("[GoogleMapsContainer] Error setting mapTypeId:", err);
    }
  }, [map, tileMode]);


  const mapId =
    import.meta.env.VITE_GOOGLE_MAP_ID ||
    (typeof process !== "undefined" ? (process.env as any)?.REACT_APP_GOOGLE_MAP_ID : "") ||
    "DEMO_MAP_ID";

  const mapOptions = useMemo<google.maps.MapOptions>(() => {
    const opts: google.maps.MapOptions = {
      mapId,
      disableDefaultUI: true,
      clickableIcons: false,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      rotateControl: true,
      headingInteractionEnabled: true,
      tiltInteractionEnabled: true,
      heading: 0,
      tilt: 0,
      minZoom,
      maxZoom,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi",              elementType: "all",    stylers: [{ visibility: "off" }] },
        { featureType: "poi.business",     elementType: "all",    stylers: [{ visibility: "off" }] },
        { featureType: "poi.government",   elementType: "all",    stylers: [{ visibility: "off" }] },
        { featureType: "poi.medical",      elementType: "all",    stylers: [{ visibility: "off" }] },
        { featureType: "poi.school",       elementType: "all",    stylers: [{ visibility: "off" }] },
        { featureType: "poi.park",         elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi.sports_complex", elementType: "all",  stylers: [{ visibility: "off" }] },
        { featureType: "poi.attraction",   elementType: "all",    stylers: [{ visibility: "off" }] },
        { featureType: "transit",          elementType: "all",    stylers: [{ visibility: "off" }] },
        { featureType: "transit.station",  elementType: "all",    stylers: [{ visibility: "off" }] },
      ],
    };

    if (typeof google !== "undefined" && "maps" in google && (google.maps as any)?.RenderingType) {
      opts.renderingType = (google.maps as any).RenderingType.VECTOR;
    } else {
      (opts as any).renderingType = "VECTOR";
    }

    return opts;
  }, [mapId, minZoom, maxZoom]);

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-center text-slate-300">
        <div className="max-w-md rounded-2xl border border-red-800/60 bg-red-950/30 p-6 backdrop-blur-md">
          <p className="text-sm font-semibold text-red-400">Failed to load Google Maps</p>
          <p className="mt-1 text-xs text-red-300/80">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-xs font-medium">Loading Google Maps…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={googleCenter}
        zoom={zoom}
        options={mapOptions}
        onLoad={(loadedMap) => {
          mapRef.current = loadedMap;
          setMap(loadedMap);
          onMapReady?.(loadedMap);
        }}
        onUnmount={() => {
          mapRef.current = null;
          setMap(null);
        }}
        onClick={onClick}
      >
        <MapContext.Provider value={map}>
          {map && children}
        </MapContext.Provider>
      </GoogleMap>
    </div>
  );
}

export { useJsApiLoader };