import { useState, useCallback } from "react";
import { staffApi } from "@/api/staff.api";
import { useCampusHierarchy } from "./useCampusHierarchy";
import { sortStaff } from "@/utils";
import type { Building, CreateStaffBody, UpdateStaffBody, FloorOption, OfficeOption, StaffWithContext } from "@/types";


interface UseStaffReturn {
  staff:         StaffWithContext[];
  buildings:     Building[];
  floorOptions:  FloorOption[];
  officeOptions: OfficeOption[];
  isLoading:     boolean;
  error:         string | null;
  fetchStaff:    () => Promise<void>;
  createStaff:   (officeId: string, body: CreateStaffBody) => Promise<void>;
  updateStaff:   (id: string, body: UpdateStaffBody) => Promise<void>;
  deleteStaff:   (id: string) => Promise<void>;
}

export function useStaff(): UseStaffReturn {
  // ── Campus tree comes from the shared hook ─────────────────────────────────
  const {
    buildings,
    floorOptions,
    officeOptions,
    isLoading: hierarchyLoading,
    error:     hierarchyError,
    refresh:   refreshHierarchy,
  } = useCampusHierarchy();

  // ── Staff-specific state ───────────────────────────────────────────────────
  const [staff,       setStaff]       = useState<StaffWithContext[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError,   setStaffError]   = useState<string | null>(null);

  const isLoading = hierarchyLoading || staffLoading;
  const error     = hierarchyError ?? staffError;

  /**
   * Fetch chain: refresh campus tree (buildings → floors → offices) via the
   * shared hook, then fetch staff per office in parallel using the freshly
   * returned officeOptions. Each staff member is enriched with
   * office/floor/building context.
   */
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    setStaffError(null);
    try {
      // refreshHierarchy() returns the snapshot so we can use it immediately
      // without waiting for a React state-update cycle.
      const { officeOptions: freshOffices } = await refreshHierarchy();

      const staffByOffice = await Promise.all(
        freshOffices.map((o) =>
          staffApi.getByOffice(o.id).then((d) =>
            d.staff.map((s): StaffWithContext => ({
              ...s,
              officeName:   o.name,
              roomNumber:   o.roomNumber,
              floorId:      o.floorId,
              floorNumber:  o.floorNumber,
              buildingId:   o.buildingId,
              buildingName: o.buildingName,
            }))
          )
        )
      );
      setStaff(sortStaff(staffByOffice.flat()));
    } catch (err: unknown) {
      setStaffError(err instanceof Error ? err.message : "Failed to load staff.");
    } finally {
      setStaffLoading(false);
    }
  }, [refreshHierarchy]);

  const createStaff = useCallback(
    async (officeId: string, body: CreateStaffBody) => {
      setStaffError(null);
      try {
        const created = await staffApi.create(officeId, body);
        const office  = officeOptions.find((o) => o.id === officeId);
        const enriched: StaffWithContext = {
          ...created,
          officeName:   office?.name         ?? "Unknown",
          roomNumber:   office?.roomNumber   ?? "",
          floorId:      office?.floorId      ?? "",
          floorNumber:  office?.floorNumber  ?? 0,
          buildingId:   office?.buildingId   ?? "",
          buildingName: office?.buildingName ?? "Unknown",
        };
        setStaff((prev) => sortStaff([...prev, enriched]));
      } catch (err: unknown) {
        setStaffError(err instanceof Error ? err.message : "Failed to create staff member.");
        throw err;
      }
    },
    [officeOptions]
  );

  const updateStaff = useCallback(async (id: string, body: UpdateStaffBody) => {
    setStaffError(null);
    try {
      const updated = await staffApi.update(id, body);
      setStaff((prev) =>
        sortStaff(
          prev.map((s) =>
            s.id === id
              ? {
                  ...updated,
                  officeName:   s.officeName,
                  roomNumber:   s.roomNumber,
                  floorId:      s.floorId,
                  floorNumber:  s.floorNumber,
                  buildingId:   s.buildingId,
                  buildingName: s.buildingName,
                }
              : s
          )
        )
      );
    } catch (err: unknown) {
      setStaffError(err instanceof Error ? err.message : "Failed to update staff member.");
      throw err;
    }
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    setStaffError(null);
    try {
      await staffApi.delete(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setStaffError(err instanceof Error ? err.message : "Failed to delete staff member.");
      throw err;
    }
  }, []);

  return {
    staff, buildings, floorOptions, officeOptions,
    isLoading, error,
    fetchStaff, createStaff, updateStaff, deleteStaff,
  };
}
