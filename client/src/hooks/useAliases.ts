import { useState, useCallback } from "react";
import { aliasApi } from "@/api/alias.api";
import { useCampusHierarchy } from "./useCampusHierarchy";
import type { AliasWithContext, CreateAliasBody, SearchAlias, Building, FloorOption } from "@/types";

interface UseAliasesReturn {
  aliases: AliasWithContext[];
  buildings: Building[];
  floorOptions: FloorOption[];
  isLoading: boolean;
  error: string | null;
  fetchAliases: () => Promise<void>;
  createOfficeAlias: (officeId: string, body: CreateAliasBody) => Promise<void>;
  createStaffAlias: (staffId: string, body: CreateAliasBody) => Promise<void>;
  updateAlias: (id: string, aliasText: string) => Promise<void>;
  deleteAlias: (id: string) => Promise<void>;
}

export function useAliases(): UseAliasesReturn {
  const { buildings, floorOptions, isLoading: hierarchyLoading, error: hierarchyError } = useCampusHierarchy();

  const [rawAliases, setRawAliases] = useState<SearchAlias[]>([]);
  const [aliasLoading, setAliasLoading] = useState(false);
  const [aliasError, setAliasError] = useState<string | null>(null);

  const isLoading = hierarchyLoading || aliasLoading;
  const error = hierarchyError ?? aliasError;

  const fetchAliases = useCallback(async () => {
    setAliasLoading(true);
    setAliasError(null);
    try {
      const data = await aliasApi.getAll();
      setRawAliases(data.aliases || []);
    } catch (err: unknown) {
      setAliasError(err instanceof Error ? err.message : "Failed to load search aliases.");
    } finally {
      setAliasLoading(false);
    }
  }, []);

  const createOfficeAlias = useCallback(async (officeId: string, body: CreateAliasBody) => {
    setAliasError(null);
    try {
      await aliasApi.createForOffice(officeId, body);
      await fetchAliases();
    } catch (err: unknown) {
      setAliasError(err instanceof Error ? err.message : "Failed to create alias.");
      throw err;
    }
  }, [fetchAliases]);

  const createStaffAlias = useCallback(async (staffId: string, body: CreateAliasBody) => {
    setAliasError(null);
    try {
      await aliasApi.createForStaff(staffId, body);
      await fetchAliases();
    } catch (err: unknown) {
      setAliasError(err instanceof Error ? err.message : "Failed to create alias.");
      throw err;
    }
  }, [fetchAliases]);

  const updateAlias = useCallback(async (id: string, aliasText: string) => {
    setAliasError(null);
    try {
      await aliasApi.update(id, { alias: aliasText });
      await fetchAliases();
    } catch (err: unknown) {
      setAliasError(err instanceof Error ? err.message : "Failed to update alias.");
      throw err;
    }
  }, [fetchAliases]);

  const deleteAlias = useCallback(async (id: string) => {
    setAliasError(null);
    try {
      await aliasApi.delete(id);
      setRawAliases((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      setAliasError(err instanceof Error ? err.message : "Failed to delete alias.");
      throw err;
    }
  }, []);

  const aliases: AliasWithContext[] = rawAliases.map((a) => {
    if (a.staff) {
      const office = a.staff.office;
      const buildingName = office?.floor?.building?.name || "Unknown Building";
      return {
        ...a,
        targetName: a.staff.fullName,
        targetType: "Staff",
        buildingName,
        roomNumber: office?.roomNumber,
      };
    }
    const office = a.office;
    const buildingName = office?.floor?.building?.name || "Unknown Building";
    return {
      ...a,
      targetName: office?.name || "Unknown Office",
      targetType: "Office",
      buildingName,
      roomNumber: office?.roomNumber,
    };
  });

  return {
    aliases,
    buildings,
    floorOptions,
    isLoading,
    error,
    fetchAliases,
    createOfficeAlias,
    createStaffAlias,
    updateAlias,
    deleteAlias,
  };
}
