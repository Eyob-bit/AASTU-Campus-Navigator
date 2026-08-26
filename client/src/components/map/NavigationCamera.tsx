import { useEffect, useRef } from "react";
import { LngLatBounds } from "maplibre-gl";
import { useMapInstance } from "./MapLibreContainer";
import { useAppStore } from "@/store";

interface NavigationCameraProps {
  userLocation: { lat: number; lng: number } | null;
  fusedHeading: number;
  isFollowingUser: boolean;
  setIsFollowingUser: (val: boolean) => void;
  shouldCenter: boolean;
  setShouldCenter: (val: boolean) => void;
}

export function NavigationCamera({
  userLocation,
  fusedHeading,
  isFollowingUser,
  setIsFollowingUser,
  shouldCenter,
  setShouldCenter,
}: NavigationCameraProps) {
  const map = useMapInstance();
  const { navStep, destinationTarget } = useAppStore();
  const hasFitRouteRef = useRef<boolean>(false);
  const isNavigating = navStep === "OUTDOOR_NAV";

  // Listen for user manual gestures (drag/pan) to pause follow mode
  useEffect(() => {
    if (!map) return;

    const handleUserInteraction = () => {
      if (isNavigating) {
        setIsFollowingUser(false);
      }
    };

    map.on("dragstart", handleUserInteraction);
    map.on("rotatestart", handleUserInteraction);
    map.on("pitchstart", handleUserInteraction);

    return () => {
      map.off("dragstart", handleUserInteraction);
      map.off("rotatestart", handleUserInteraction);
      map.off("pitchstart", handleUserInteraction);
    };
  }, [map, isNavigating, setIsFollowingUser]);

  // Initial fit bounds when outdoor navigation starts
  useEffect(() => {
    if (!map) return;

    if (isNavigating && destinationTarget && userLocation && !hasFitRouteRef.current) {
      const bounds = new LngLatBounds();
      bounds.extend([userLocation.lng, userLocation.lat]);
      bounds.extend([destinationTarget.longitude, destinationTarget.latitude]);

      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 180, left: 60, right: 60 },
        maxZoom: 18,
        duration: 1000,
      });

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
        map.flyTo({
          center: [customEvent.detail.lng, customEvent.detail.lat],
          zoom: customEvent.detail.zoom ?? 19,
          duration: 1200,
        });
      }
    }

    window.addEventListener("aastu_center_building", handleCenterBuilding);
    return () => window.removeEventListener("aastu_center_building", handleCenterBuilding);
  }, [map, setIsFollowingUser]);

  // Handle explicit manual recenter / center location button
  useEffect(() => {
    if (!map || !shouldCenter || !userLocation) return;

    setIsFollowingUser(true);
    const targetZoom = Math.max(map.getZoom(), 18);

    if (isNavigating) {
      map.easeTo({
        center: [userLocation.lng, userLocation.lat],
        bearing: fusedHeading,
        pitch: 50,
        zoom: 19,
        padding: { top: 60, bottom: Math.round(window.innerHeight * 0.35), left: 0, right: 0 },
        duration: 800,
      });
    } else {
      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: targetZoom,
        pitch: 0,
        bearing: 0,
        duration: 800,
      });
    }

    setShouldCenter(false);
  }, [map, shouldCenter, userLocation, isNavigating, fusedHeading, setIsFollowingUser, setShouldCenter]);

  // Sole owner of MapLibre camera during active OUTDOOR_NAV + FOLLOW=true
  useEffect(() => {
    if (!map || !isNavigating || !isFollowingUser || !userLocation) return;

    // Instant position snap (no lag) + smooth bearing/pitch ease
    map.jumpTo({
      center: [userLocation.lng, userLocation.lat],
      bearing: fusedHeading,
      pitch: 50,
      zoom: 19,
      padding: { top: 60, bottom: Math.round(window.innerHeight * 0.32), left: 0, right: 0 },
    });
  }, [map, isNavigating, isFollowingUser, userLocation, fusedHeading]);

  // Navigation camera handles camera tracking and returns no DOM elements
  return null;
}
