import { useEffect, useRef } from "react";
import { Marker, type MapMouseEvent } from "maplibre-gl";
import { useMapInstance } from "./MapLibreContainer";

interface MapLocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

/**
 * Reusable marker-picker: click anywhere on the MapLibre map or drag the marker
 * to update coordinates. Must be rendered inside <MapLibreContainer>.
 */
export function MapLocationPickerInner({ lat, lng, onChange }: MapLocationPickerProps) {
  const map = useMapInstance();
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Click on map to set pin
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: MapMouseEvent) => {
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map]);

  // Sync marker pin position and drag events
  useEffect(() => {
    if (!map || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    if (!markerRef.current) {
      const marker = new Marker({
        draggable: true,
        color: "#06b6d4",
      })
        .setLngLat([lng, lat])
        .addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        onChangeRef.current(pos.lat, pos.lng);
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, lat, lng]);

  return null;
}
