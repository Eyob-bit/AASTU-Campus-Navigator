import { useEffect, useRef } from "react";
import { useGoogleMapInstance } from "./GoogleMapsContainer";
import { useAppStore } from "@/store";

interface NavigationCameraProps {
  userLocation: { lat: number; lng: number } | null;
  isFollowingUser: boolean;
  setIsFollowingUser: (val: boolean) => void;
  shouldCenter: boolean;
  setShouldCenter: (val: boolean) => void;
}

export function NavigationCamera({
  userLocation,
  isFollowingUser,
  setIsFollowingUser,
  shouldCenter,
  setShouldCenter,
}: NavigationCameraProps) {
  const map = useGoogleMapInstance();
  const navStep = useAppStore((s) => s.navStep);
  const destinationTarget = useAppStore((s) => s.destinationTarget);
  const hasFitRouteRef = useRef<boolean>(false);
  const isNavigating = navStep === "OUTDOOR_NAV";
  const lastEaseToTimeRef = useRef<number>(0);
  const easeToTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for user manual gestures (drag/pan) to pause follow mode
  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps) return;

    const handleUserInteraction = () => {
      if (isNavigating) {
        setIsFollowingUser(false);
      }
    };

    const dragListener = map.addListener("dragstart", handleUserInteraction);

    return () => {
      google.maps.event.removeListener(dragListener);
    };
  }, [map, isNavigating, setIsFollowingUser]);

  // Initial fit bounds when outdoor navigation starts
  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps) return;

    if (isNavigating && destinationTarget && userLocation && !hasFitRouteRef.current) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
      bounds.extend(
        new google.maps.LatLng(destinationTarget.latitude, destinationTarget.longitude)
      );

      map.fitBounds(bounds, 60);
      hasFitRouteRef.current = true;
    }

    if (!isNavigating) {
      hasFitRouteRef.current = false;
      setIsFollowingUser(true);
    }
  }, [map, isNavigating, destinationTarget, userLocation, setIsFollowingUser]);

  // Listen for AI chatbot "Show on Map" events
  useEffect(() => {
    if (!map) return;

    function handleCenterBuilding(e: Event) {
      if (!map) return;
      const customEvent = e as CustomEvent<{ lat: number; lng: number; zoom?: number }>;
      if (customEvent.detail?.lat && customEvent.detail?.lng) {
        setIsFollowingUser(false);
        map.setCenter({
          lat: customEvent.detail.lat,
          lng: customEvent.detail.lng,
        });
        map.setZoom(customEvent.detail.zoom ?? 19);
      }
    }

    window.addEventListener("aastu_center_building", handleCenterBuilding);
    return () => window.removeEventListener("aastu_center_building", handleCenterBuilding);
  }, [map, setIsFollowingUser]);

  // Handle explicit manual recenter / center location button
  useEffect(() => {
    if (!map || !shouldCenter || !userLocation) return;

    setIsFollowingUser(true);

    if (isNavigating) {
      map.setCenter({
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
      map.setZoom(19);
    } else {
      map.setCenter({
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
      map.setZoom(19);
    }

    setShouldCenter(false);
  }, [map, shouldCenter, userLocation, isNavigating, setShouldCenter, setIsFollowingUser]);

  // Camera update during active navigation - smooth following
  useEffect(() => {
    if (!map || !isNavigating || !isFollowingUser || !userLocation) return;

    const now = Date.now();
    const elapsed = now - lastEaseToTimeRef.current;

    if (elapsed >= 200) {
      lastEaseToTimeRef.current = now;
      map.panTo({
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
    } else {
      if (easeToTimerRef.current !== null) {
        clearTimeout(easeToTimerRef.current);
      }
      easeToTimerRef.current = setTimeout(() => {
        map.panTo({
          lat: userLocation.lat,
          lng: userLocation.lng,
        });
        easeToTimerRef.current = null;
      }, 200 - elapsed);
    }
  }, [map, isNavigating, isFollowingUser, userLocation]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (easeToTimerRef.current !== null) {
        clearTimeout(easeToTimerRef.current);
      }
    };
  }, []);

  return null;
}