import { useState, useCallback } from "react";
import { buildingApi } from "@/api/building.api";
import { floorApi } from "@/api/floor.api";
import { officeApi } from "@/api/office.api";
import type { Building, FloorOption, OfficeOption } from "@/types";

/** Data snapshot returned by `refresh()` for synchronous use by callers. */
export interface HierarchySnapshot {
  buildings:     Building[];
  floorOptions:  FloorOption[];
  officeOptions: OfficeOption[];
}

export interface CampusHierarchy {
  buildings:     Building[];
  floorOptions:  FloorOption[];
  officeOptions: OfficeOption[];
  isLoading:     boolean;
  error:         string | null;
  /**
   * Reloads the full campus tree (buildings → floors → offices) and returns
   * the freshly loaded data so callers can use it without waiting for a
   * React state update cycle.
   */
  refresh: () => Promise<HierarchySnapshot>;
}

/**
 * Loads the full campus hierarchy: buildings → floors → offices.
 *
 * Single source of truth consumed by useOffices, useStaff, and any
 * future hook that needs to traverse the building/floor/office tree.
 * Keeps the N+1 fetch chain in one place so it never has to be
 * duplicated again.
 */
export function useCampusHierarchy(): CampusHierarchy {
  const [buildings,     setBuildings]     = useState<Building[]>([]);
  const [floorOptions,  setFloorOptions]  = useState<FloorOption[]>([]);
  const [officeOptions, setOfficeOptions] = useState<OfficeOption[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<HierarchySnapshot> => {
    setIsLoading(true);
    setError(null);
    try {
      // ── 1. Buildings ───────────────────────────────────────────────────
      const buildingData  = await buildingApi.getAll();
      const allBuildings  = buildingData.buildings;
      setBuildings(allBuildings);

      const buildingMap = new Map(allBuildings.map((b) => [b.id, b]));

      // ── 2. Floors (parallel per building) ─────────────────────────────
      const floorsByBuilding = await Promise.all(
        allBuildings.map((b) =>
          floorApi.getByBuilding(b.id).then((d) =>
            d.floors.map((f): FloorOption => ({ ...f, buildingName: b.name }))
          )
        )
      );
      const allFloors = floorsByBuilding.flat();
      const sortedFloors = [...allFloors].sort((a, b) => {
        const byBuilding = a.buildingName.localeCompare(b.buildingName);
        return byBuilding !== 0 ? byBuilding : a.floorNumber - b.floorNumber;
      });
      setFloorOptions(sortedFloors);

      // ── 3. Offices (parallel per floor) ───────────────────────────────
      const officesByFloor = await Promise.all(
        allFloors.map((f) =>
          officeApi.getByFloor(f.id).then((d) =>
            d.offices.map((o): OfficeOption => ({
              id:           o.id,
              name:         o.name,
              roomNumber:   o.roomNumber,
              floorId:      f.id,
              floorNumber:  f.floorNumber,
              buildingId:   f.buildingId,
              buildingName: buildingMap.get(f.buildingId)?.name ?? "Unknown",
            }))
          )
        )
      );
      const sortedOffices = [...officesByFloor.flat()].sort((a, b) => {
        const byBuilding = a.buildingName.localeCompare(b.buildingName);
        if (byBuilding !== 0) return byBuilding;
        const byFloor = a.floorNumber - b.floorNumber;
        return byFloor !== 0 ? byFloor : a.name.localeCompare(b.name);
      });
      setOfficeOptions(sortedOffices);

      return { buildings: allBuildings, floorOptions: sortedFloors, officeOptions: sortedOffices };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load campus hierarchy.";
      setError(msg);
      // Re-throw so callers (useOffices, useStaff) can handle the error themselves.
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { buildings, floorOptions, officeOptions, isLoading, error, refresh };
}
