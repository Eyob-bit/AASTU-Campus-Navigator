import { useState, useCallback } from "react";
import { buildingApi } from "@/api/building.api";
import type { Building, CreateBuildingBody, UpdateBuildingBody } from "@/types";

interface UseBuildingsReturn {
  buildings: Building[];
  isLoading: boolean;
  error: string | null;
  fetchBuildings: () => Promise<void>;
  createBuilding: (body: CreateBuildingBody) => Promise<void>;
  updateBuilding: (id: string, body: UpdateBuildingBody) => Promise<void>;
  deleteBuilding: (id: string) => Promise<void>;
}

export function useBuildings(): UseBuildingsReturn {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchBuildings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await buildingApi.getAll();
      setBuildings(data.buildings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load buildings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBuilding = useCallback(async (body: CreateBuildingBody) => {
    setError(null);
    try {
      const created = await buildingApi.create(body);
      setBuildings((prev) => [created, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create building.");
      throw err;
    }
  }, []);

  const updateBuilding = useCallback(async (id: string, body: UpdateBuildingBody) => {
    setError(null);
    try {
      const updated = await buildingApi.update(id, body);
      setBuildings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update building.");
      throw err;
    }
  }, []);

  const deleteBuilding = useCallback(async (id: string) => {
    setError(null);
    try {
      await buildingApi.delete(id);
      setBuildings((prev) => prev.filter((b) => b.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete building.");
      throw err;
    }
  }, []);

  return { buildings, isLoading, error, fetchBuildings, createBuilding, updateBuilding, deleteBuilding };
}
