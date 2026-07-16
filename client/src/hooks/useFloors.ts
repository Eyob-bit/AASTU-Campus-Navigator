import { useState, useCallback } from "react";
import { floorApi } from "@/api/floor.api";
import { buildingApi } from "@/api/building.api";
import type { Floor, Building } from "@/types";

function sortFloors(list: FloorWithBuilding[]): FloorWithBuilding[] {
  return [...list].sort((a, b) => {
    const byBuilding = a.buildingName.localeCompare(b.buildingName);
    return byBuilding !== 0 ? byBuilding : a.floorNumber - b.floorNumber;
  });
}

/** Floor enriched with its building name for display */
export interface FloorWithBuilding extends Floor {
  buildingName: string;
}

interface UseFloorsReturn {
  floors: FloorWithBuilding[];
  buildings: Building[];        // exposed so the form can populate the dropdown
  isLoading: boolean;
  error: string | null;
  fetchFloors: () => Promise<void>;
  createFloor: (buildingId: string, floorNumber: number) => Promise<void>;
  updateFloor: (id: string, floorNumber: number) => Promise<void>;
  deleteFloor: (id: string) => Promise<void>;
}

export function useFloors(): UseFloorsReturn {
  const [floors,    setFloors]    = useState<FloorWithBuilding[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  /**
   * Fetches all buildings, then fetches floors for every building in parallel,
   * and enriches each floor with its building name.
   */
  const fetchFloors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const buildingData = await buildingApi.getAll();
      const allBuildings = buildingData.buildings;
      setBuildings(allBuildings);

      const results = await Promise.all(
        allBuildings.map((b) =>
          floorApi.getByBuilding(b.id).then((d) =>
            d.floors.map((f): FloorWithBuilding => ({ ...f, buildingName: b.name }))
          )
        )
      );

      setFloors(
        sortFloors(results.flat())
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load floors.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFloor = useCallback(async (buildingId: string, floorNumber: number) => {
    setError(null);
    try {
      const created = await floorApi.create(buildingId, { floorNumber });
      const buildingName =
        buildings.find((b) => b.id === buildingId)?.name ?? "Unknown Building";
      setFloors((prev) => sortFloors([...prev, { ...created, buildingName }]));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create floor.");
      throw err;
    }
  }, [buildings]);

  const updateFloor = useCallback(async (id: string, floorNumber: number) => {
    setError(null);
    try {
      const updated = await floorApi.update(id, { floorNumber });
      setFloors((prev) =>
        sortFloors(
          prev.map((f) =>
            f.id === id ? { ...updated, buildingName: f.buildingName } : f
          )
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update floor.");
      throw err;
    }
  }, []);

  const deleteFloor = useCallback(async (id: string) => {
    setError(null);
    try {
      await floorApi.delete(id);
      setFloors((prev) => prev.filter((f) => f.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete floor.");
      throw err;
    }
  }, []);

  return { floors, buildings, isLoading, error, fetchFloors, createFloor, updateFloor, deleteFloor };
}
