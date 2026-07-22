import { useState, useCallback } from "react";
import { buildingApi } from "@/api/building.api";
import { floorApi } from "@/api/floor.api";
import { sceneApi } from "@/api/scene.api";
import type { Building, FloorOption, PanoramaScene } from "@/types";

/** Scene enriched with building + floor context for display in the gallery. */
export interface SceneWithContext extends PanoramaScene {
  buildingId: string;
  buildingName: string;
  floorNumber: number;
}

interface UsePanoramasReturn {
  scenes: SceneWithContext[];
  buildings: Building[];
  floorOptions: FloorOption[];
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  createScene: (floorId: string, formData: FormData) => Promise<void>;
  updateScene: (id: string, formData: FormData) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
}

/**
 * Loads all panorama scenes across all buildings and floors.
 *
 * Fetch order: buildings → floors (parallel) → scenes (parallel per floor).
 * Each scene is enriched with buildingName and floorNumber for display.
 *
 * Follows the same pattern as useFloors / useCampusHierarchy.
 */
export function usePanoramas(): UsePanoramasReturn {
  const [scenes,      setScenes]      = useState<SceneWithContext[]>([]);
  const [buildings,   setBuildings]   = useState<Building[]>([]);
  const [floorOptions, setFloorOptions] = useState<FloorOption[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Buildings
      const buildingData = await buildingApi.getAll();
      const allBuildings = buildingData.buildings;
      setBuildings(allBuildings);

      // 2. Floors (parallel per building)
      const floorsByBuilding = await Promise.all(
        allBuildings.map((b) =>
          floorApi.getByBuilding(b.id).then((d) =>
            d.floors.map((f): FloorOption => ({ ...f, buildingName: b.name }))
          )
        )
      );
      const allFloors = floorsByBuilding.flat().sort((a, b) => {
        const byBuilding = a.buildingName.localeCompare(b.buildingName);
        return byBuilding !== 0 ? byBuilding : a.floorNumber - b.floorNumber;
      });
      setFloorOptions(allFloors);

      // 3. Scenes (parallel per floor)
      const buildingMap = new Map(allBuildings.map((b) => [b.id, b.name]));
      const scenesByFloor = await Promise.all(
        allFloors.map((f) =>
          floorApi.getScenes(f.id).then((d) =>
            d.scenes.map((s): SceneWithContext => ({
              ...s,
              buildingId:   f.buildingId,
              buildingName: buildingMap.get(f.buildingId) ?? "Unknown",
              floorNumber:  f.floorNumber,
            }))
          )
        )
      );

      const sorted = scenesByFloor.flat().sort((a, b) => {
        const byBuilding = a.buildingName.localeCompare(b.buildingName);
        if (byBuilding !== 0) return byBuilding;
        const byFloor = a.floorNumber - b.floorNumber;
        return byFloor !== 0 ? byFloor : a.displayOrder - b.displayOrder;
      });
      setScenes(sorted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load panorama scenes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createScene = useCallback(async (floorId: string, formData: FormData) => {
    setError(null);
    try {
      const created = await floorApi.createScene(floorId, formData);
      // Re-fetch to get enriched context (buildingName, floorNumber)
      // We optimistically add with what we know and then rely on fetchAll for accuracy.
      setScenes((prev) => {
        const floor = prev.find((s) => s.floorId === floorId);
        const enriched: SceneWithContext = {
          ...created,
          buildingId:   floor?.buildingId   ?? "",
          buildingName: floor?.buildingName ?? "",
          floorNumber:  floor?.floorNumber  ?? 0,
        };
        return [...prev, enriched].sort((a, b) => {
          const byBuilding = a.buildingName.localeCompare(b.buildingName);
          if (byBuilding !== 0) return byBuilding;
          const byFloor = a.floorNumber - b.floorNumber;
          return byFloor !== 0 ? byFloor : a.displayOrder - b.displayOrder;
        });
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create scene.");
      throw err;
    }
  }, []);

  const updateScene = useCallback(async (id: string, formData: FormData) => {
    setError(null);
    try {
      const updated = await sceneApi.update(id, formData);
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...updated, buildingId: s.buildingId, buildingName: s.buildingName, floorNumber: s.floorNumber }
            : s
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update scene.");
      throw err;
    }
  }, []);

  const deleteScene = useCallback(async (id: string) => {
    setError(null);
    try {
      await sceneApi.delete(id);
      setScenes((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete scene.");
      throw err;
    }
  }, []);

  return {
    scenes,
    buildings,
    floorOptions,
    isLoading,
    error,
    fetchAll,
    createScene,
    updateScene,
    deleteScene,
  };
}
