import { useState, useCallback } from "react";
import { officeApi } from "@/api/office.api";
import { floorApi } from "@/api/floor.api";
import { buildingApi } from "@/api/building.api";
import type { Office, Floor, Building, CreateOfficeBody, UpdateOfficeBody } from "@/types";

/** Office enriched with floor and building context for display */
export interface OfficeWithContext extends Office {
  floorNumber: number;
  buildingId: string;
  buildingName: string;
}

/** Floor enriched with its building name — used for the form dropdowns */
export interface FloorOption extends Floor {
  buildingName: string;
}

function sortOffices(list: OfficeWithContext[]): OfficeWithContext[] {
  return [...list].sort((a, b) => {
    const byBuilding = a.buildingName.localeCompare(b.buildingName);
    if (byBuilding !== 0) return byBuilding;
    const byFloor = a.floorNumber - b.floorNumber;
    if (byFloor !== 0) return byFloor;
    return a.name.localeCompare(b.name);
  });
}

interface UseOfficesReturn {
  offices: OfficeWithContext[];
  buildings: Building[];
  floorOptions: FloorOption[];
  isLoading: boolean;
  error: string | null;
  fetchOffices: () => Promise<void>;
  createOffice: (floorId: string, body: CreateOfficeBody) => Promise<void>;
  updateOffice: (id: string, body: UpdateOfficeBody) => Promise<void>;
  deleteOffice: (id: string) => Promise<void>;
}

export function useOffices(): UseOfficesReturn {
  const [offices,      setOffices]      = useState<OfficeWithContext[]>([]);
  const [buildings,    setBuildings]    = useState<Building[]>([]);
  const [floorOptions, setFloorOptions] = useState<FloorOption[]>([]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  /**
   * 1. Fetch all buildings
   * 2. Fetch all floors per building in parallel  (N+1 — acceptable until backend adds /floors)
   * 3. Fetch all offices per floor in parallel
   * 4. Enrich each office with its floor/building context
   */
  const fetchOffices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const buildingData = await buildingApi.getAll();
      const allBuildings = buildingData.buildings;
      setBuildings(allBuildings);

      // Build a Map for O(1) lookups
      const buildingMap = new Map(allBuildings.map((b) => [b.id, b]));

      // Fetch floors for every building
      const floorsByBuilding = await Promise.all(
        allBuildings.map((b) =>
          floorApi.getByBuilding(b.id).then((d) =>
            d.floors.map((f): FloorOption => ({
              ...f,
              buildingName: b.name,
            }))
          )
        )
      );
      const allFloors = floorsByBuilding.flat();
      setFloorOptions(
        [...allFloors].sort((a, b) => {
          const byBuilding = a.buildingName.localeCompare(b.buildingName);
          return byBuilding !== 0 ? byBuilding : a.floorNumber - b.floorNumber;
        })
      );

      // Fetch offices for every floor
      const officesByFloor = await Promise.all(
        allFloors.map((f) =>
          officeApi.getByFloor(f.id).then((d) =>
            d.offices.map((o): OfficeWithContext => ({
              ...o,
              floorNumber:  f.floorNumber,
              buildingId:   f.buildingId,
              buildingName: buildingMap.get(f.buildingId)?.name ?? "Unknown",
            }))
          )
        )
      );

      setOffices(sortOffices(officesByFloor.flat()));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load offices.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOffice = useCallback(
    async (floorId: string, body: CreateOfficeBody) => {
      setError(null);
      try {
        const created = await officeApi.create(floorId, body);
        const floor   = floorOptions.find((f) => f.id === floorId);
        const enriched: OfficeWithContext = {
          ...created,
          floorNumber:  floor?.floorNumber  ?? 0,
          buildingId:   floor?.buildingId   ?? "",
          buildingName: floor?.buildingName ?? "Unknown",
        };
        setOffices((prev) => sortOffices([...prev, enriched]));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create office.");
        throw err;
      }
    },
    [floorOptions]
  );

  const updateOffice = useCallback(async (id: string, body: UpdateOfficeBody) => {
    setError(null);
    try {
      const updated = await officeApi.update(id, body);
      setOffices((prev) =>
        sortOffices(
          prev.map((o) =>
            o.id === id
              ? { ...updated, floorNumber: o.floorNumber, buildingId: o.buildingId, buildingName: o.buildingName }
              : o
          )
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update office.");
      throw err;
    }
  }, []);

  const deleteOffice = useCallback(async (id: string) => {
    setError(null);
    try {
      await officeApi.delete(id);
      setOffices((prev) => prev.filter((o) => o.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete office.");
      throw err;
    }
  }, []);

  return {
    offices, buildings, floorOptions,
    isLoading, error,
    fetchOffices, createOffice, updateOffice, deleteOffice,
  };
}
