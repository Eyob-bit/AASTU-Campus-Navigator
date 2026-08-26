/**
 * Sorting utilities — pure functions shared by hooks and pages.
 * Extracted from the local sort functions that lived inside useFloors,
 * useOffices, and useStaff.  All sort orders are identical to before.
 */
import type { Building, FloorWithBuilding, OfficeWithContext, StaffWithContext } from "@/types";

export function sortBuildings(list: Building[], sortKey?: string): Building[] {
  if (!sortKey) return [...list].sort((a, b) => a.name.localeCompare(b.name));
  const [field, dir] = sortKey.split("-");
  const mult = dir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    if (field === "name") return mult * a.name.localeCompare(b.name);
    if (field === "code") return mult * a.code.localeCompare(b.code);
    return 0;
  });
}

export function sortFloors(list: FloorWithBuilding[], sortKey?: string): FloorWithBuilding[] {
  if (!sortKey) {
    return [...list].sort((a, b) => {
      const byBuilding = a.buildingName.localeCompare(b.buildingName);
      return byBuilding !== 0 ? byBuilding : a.floorNumber - b.floorNumber;
    });
  }
  const [field, dir] = sortKey.split("-");
  const mult = dir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    if (field === "building") return mult * a.buildingName.localeCompare(b.buildingName);
    if (field === "floor") return mult * (a.floorNumber - b.floorNumber);
    return 0;
  });
}

export function sortOffices(list: OfficeWithContext[], sortKey?: string): OfficeWithContext[] {
  if (!sortKey) {
    return [...list].sort((a, b) => {
      const byBuilding = a.buildingName.localeCompare(b.buildingName);
      if (byBuilding !== 0) return byBuilding;
      const byFloor = a.floorNumber - b.floorNumber;
      if (byFloor !== 0) return byFloor;
      return a.name.localeCompare(b.name);
    });
  }
  const [field, dir] = sortKey.split("-");
  const mult = dir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    if (field === "name") return mult * a.name.localeCompare(b.name);
    if (field === "building") return mult * a.buildingName.localeCompare(b.buildingName);
    if (field === "floor") return mult * (a.floorNumber - b.floorNumber);
    if (field === "room") return mult * a.roomNumber.localeCompare(b.roomNumber);
    return 0;
  });
}

export function sortStaff(list: StaffWithContext[], sortKey?: string): StaffWithContext[] {
  if (!sortKey) {
    return [...list].sort((a, b) => {
      const byBuilding = a.buildingName.localeCompare(b.buildingName);
      if (byBuilding !== 0) return byBuilding;
      const byFloor = a.floorNumber - b.floorNumber;
      if (byFloor !== 0) return byFloor;
      const byOffice = a.officeName.localeCompare(b.officeName);
      if (byOffice !== 0) return byOffice;
      return a.fullName.localeCompare(b.fullName);
    });
  }
  const [field, dir] = sortKey.split("-");
  const mult = dir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    if (field === "name") return mult * a.fullName.localeCompare(b.fullName);
    if (field === "building") return mult * a.buildingName.localeCompare(b.buildingName);
    if (field === "floor") return mult * (a.floorNumber - b.floorNumber);
    if (field === "office") return mult * a.officeName.localeCompare(b.officeName);
    if (field === "position") return mult * a.position.localeCompare(b.position);
    return 0;
  });
}
