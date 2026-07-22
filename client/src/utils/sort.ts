/**
 * Sorting utilities — pure functions shared by hooks and pages.
 * Extracted from the local sort functions that lived inside useFloors,
 * useOffices, and useStaff.  All sort orders are identical to before.
 */
import type { Building, FloorWithBuilding, OfficeWithContext, StaffWithContext } from "@/types";

export function sortBuildings(list: Building[]): Building[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortFloors(list: FloorWithBuilding[]): FloorWithBuilding[] {
  return [...list].sort((a, b) => {
    const byBuilding = a.buildingName.localeCompare(b.buildingName);
    return byBuilding !== 0 ? byBuilding : a.floorNumber - b.floorNumber;
  });
}

export function sortOffices(list: OfficeWithContext[]): OfficeWithContext[] {
  return [...list].sort((a, b) => {
    const byBuilding = a.buildingName.localeCompare(b.buildingName);
    if (byBuilding !== 0) return byBuilding;
    const byFloor = a.floorNumber - b.floorNumber;
    if (byFloor !== 0) return byFloor;
    return a.name.localeCompare(b.name);
  });
}

export function sortStaff(list: StaffWithContext[]): StaffWithContext[] {
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
