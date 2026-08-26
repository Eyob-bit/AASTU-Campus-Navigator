import { useEffect, useRef } from "react";
import { useGoogleMapInstance } from "./GoogleMapsContainer";

interface MapLocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export function MapLocationPickerInner({
  lat,
  lng,
  onChange,
}: MapLocationPickerProps) {
  const map = useGoogleMapInstance();
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const position = { lat, lng };

    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      const marker = new google.maps.Marker({
        position,
        map,
        draggable: true,
        title: "Drag to set location",
        animation: google.maps.Animation.DROP,
      });

      markerRef.current = marker;

      marker.addListener("dragend", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onChangeRef.current(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onChangeRef.current(e.latLng.lat(), e.latLng.lng());
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map, lat, lng]);

  return null;
}