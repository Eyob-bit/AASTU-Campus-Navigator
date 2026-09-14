import { useMemo } from "react";
import { useAppStore } from "@/store";
import type { PanoramaScene } from "@/types";
import {
  calculateIndoorNextStep,
  type IndoorNavigationStep,
} from "@/utils/indoorPathfinding";

interface UseIndoorNavigationRouteProps {
  currentSceneId: string;
  currentFloorId?: string | null;
  floorScenes: PanoramaScene[];
}

export function useIndoorNavigationRoute({
  currentSceneId,
  currentFloorId,
  floorScenes,
}: UseIndoorNavigationRouteProps): IndoorNavigationStep {
  const { destinationTarget } = useAppStore();

  const navigationStep = useMemo(() => {
    return calculateIndoorNextStep({
      floorScenes,
      currentSceneId,
      currentFloorId,
      destinationTarget,
    });
  }, [floorScenes, currentSceneId, currentFloorId, destinationTarget]);

  return navigationStep;
}
