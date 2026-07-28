import { useEffect, useRef } from "react";
import { useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Map as LeafletMap } from "leaflet";

interface MapLocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

/**
 * Reusable marker-picker: click anywhere on the map or drag the marker
 * to update coordinates. Must be rendered inside a <MapContainer>.
 */
export function MapLocationPickerInner({ lat, lng, onChange }: MapLocationPickerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  const map = useMapEvents({}) as unknown as LeafletMap;

  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Remove previous marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    if (lat === 0 && lng === 0) return;

    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).addTo(map);

    marker.on("dragend", (e) => {
      const pos = (e.target as L.Marker).getLatLng();
      onChange(pos.lat, pos.lng);
    });

    markerRef.current = marker;

    return () => {
      clearTimeout(timer);
      marker.remove();
    };
  }, [lat, lng, map, onChange]);

  return null;
}
