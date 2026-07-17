import { useState, useCallback } from "react";
import { officeApi } from "@/api/office.api";
import { useCampusHierarchy } from "./useCampusHierarchy";
import { sortOffices } from "@/utils";
import type { Building, CreateOfficeBody, UpdateOfficeBody, FloorOption, OfficeWithContext } from "@/types";


interface UseOfficesReturn {
  offices:      OfficeWithContext[];
  buildings:    Building[];
  floorOptions: FloorOption[];
  isLoading:    boolean;
  error:        string | null;
  fetchOffices: () => Promise<void>;
  createOffice: (floorId: string, body: CreateOfficeBody) => Promise<void>;
  updateOffice: (id: string, body: UpdateOfficeBody) => Promise<void>;
  deleteOffice: (id: string) => Promise<void>;
}

export function useOffices(): UseOfficesReturn {
  // ── Campus tree (buildings + floors) comes from the shared hook ────────────
  const {
    buildings,
    floorOptions,
    isLoading: hierarchyLoading,
    error:     hierarchyError,
    refresh:   refreshHierarchy,
  } = useCampusHierarchy();

  // ── Office-specific state ──────────────────────────────────────────────────
  const [offices,       setOffices]       = useState<OfficeWithContext[]>([]);
  const [officeLoading, setOfficeLoading] = useState(false);
  const [officeError,   setOfficeError]   = useState<string | null>(null);

  const isLoading = hierarchyLoading || officeLoading;
  const error     = hierarchyError ?? officeError;

  /**
   * 1. Refresh the campus tree via useCampusHierarchy (buildings → floors).
   * 2. Use the freshly returned floor list to fetch offices in parallel.
   * 3. Enrich each office with its floor / building context.
   */
  const fetchOffices = useCallback(async () => {
    setOfficeLoading(true);
    setOfficeError(null);
    try {
      // refreshHierarchy() returns the snapshot so we can use it immediately
      // without waiting for a React state-update cycle.
      const { floorOptions: freshFloors } = await refreshHierarchy();

      const officesByFloor = await Promise.all(
        freshFloors.map((f) =>
          officeApi.getByFloor(f.id).then((d) =>
            d.offices.map((o): OfficeWithContext => ({
              ...o,
              floorNumber:  f.floorNumber,
              buildingId:   f.buildingId,
              buildingName: f.buildingName,
            }))
          )
        )
      );
      setOffices(sortOffices(officesByFloor.flat()));
    } catch (err: unknown) {
      setOfficeError(err instanceof Error ? err.message : "Failed to load offices.");
    } finally {
      setOfficeLoading(false);
    }
  }, [refreshHierarchy]);

  const createOffice = useCallback(
    async (floorId: string, body: CreateOfficeBody) => {
      setOfficeError(null);
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
        setOfficeError(err instanceof Error ? err.message : "Failed to create office.");
        throw err;
      }
    },
    [floorOptions]
  );

  const updateOffice = useCallback(async (id: string, body: UpdateOfficeBody) => {
    setOfficeError(null);
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
      setOfficeError(err instanceof Error ? err.message : "Failed to update office.");
      throw err;
    }
  }, []);

  const deleteOffice = useCallback(async (id: string) => {
    setOfficeError(null);
    try {
      await officeApi.delete(id);
      setOffices((prev) => prev.filter((o) => o.id !== id));
    } catch (err: unknown) {
      setOfficeError(err instanceof Error ? err.message : "Failed to delete office.");
      throw err;
    }
  }, []);

  return {
    offices, buildings, floorOptions,
    isLoading, error,
    fetchOffices, createOffice, updateOffice, deleteOffice,
  };
}
