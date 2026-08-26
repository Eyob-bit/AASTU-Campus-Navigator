import { useEffect, useRef } from "react";
import { useGoogleMapInstance } from "./GoogleMapsContainer";

interface UserLocationMarkerProps {
  lat: number;
  lng: number;
  isNavigating?: boolean;
  heading?: number;
  isCourseUp?: boolean;
}

export function UserLocationMarker({
  lat,
  lng,
  isNavigating = false,
  heading = 0,
}: UserLocationMarkerProps) {
  const map = useGoogleMapInstance();
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      return;
    }

    const position = { lat, lng };

    const svgIcon = isNavigating
      ? `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#06B6D4" fill-opacity="0.25"/>
          <g transform="rotate(${heading}, 20, 20)">
            <path d="M20 6L31 32L20 25L9 32L20 6Z" fill="#06B6D4" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
            <path d="M20 9L27 28L20 23L13 28L20 9Z" fill="#22D3EE"/>
          </g>
        </svg>
      `)}`
      : `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="16" fill="#06B6D4" fill-opacity="0.25" stroke="#06B6D4" stroke-width="1"/>
          <circle cx="18" cy="18" r="8" fill="#06B6D4" stroke="#FFFFFF" stroke-width="2.5"/>
        </svg>
      `)}`;

    if (markerRef.current) {
      markerRef.current.setPosition(position);
      markerRef.current.setIcon({
        url: svgIcon,
        scaledSize: new google.maps.Size(isNavigating ? 40 : 36, isNavigating ? 40 : 36),
        anchor: new google.maps.Point(isNavigating ? 20 : 18, isNavigating ? 20 : 18),
      });
    } else {
      const marker = new google.maps.Marker({
        position,
        map,
        title: "Your Location",
        zIndex: 999,
        icon: {
          url: svgIcon,
          scaledSize: new google.maps.Size(isNavigating ? 40 : 36, isNavigating ? 40 : 36),
          anchor: new google.maps.Point(isNavigating ? 20 : 18, isNavigating ? 20 : 18),
        },
      });
      markerRef.current = marker;
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map, lat, lng, isNavigating, heading]);

  return null;
}