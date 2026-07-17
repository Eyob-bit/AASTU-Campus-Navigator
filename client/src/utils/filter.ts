/**
 * Search-filter utilities — pure functions shared by all CRUD pages.
 * Extracted from the inline `useMemo` filter blocks that were duplicated
 * in BuildingsPage, FloorsPage, OfficesPage, and StaffPage.
 * All filter logic is identical to the original.
 */
import type { Building, FloorWithBuilding, OfficeWithContext, StaffWithContext } from "@/types";

export function filterBuildings(list: Building[], q: string): Building[] {
  if (!q) return list;
  const lower = q.toLowerCase();
  return list.filter(
    (b) => b.name.toLowerCase().includes(lower) || b.code.toLowerCase().includes(lower)
  );
}

export function filterFloors(list: FloorWithBuilding[], q: string): FloorWithBuilding[] {
  if (!q) return list;
  const lower = q.toLowerCase();
  return list.filter(
    (f) =>
      f.buildingName.toLowerCase().includes(lower) ||
      String(f.floorNumber).includes(lower)
  );
}

export function filterOffices(list: OfficeWithContext[], q: string): OfficeWithContext[] {
  if (!q) return list;
  const lower = q.toLowerCase();
  return list.filter(
    (o) =>
      o.name.toLowerCase().includes(lower)         ||
      o.roomNumber.toLowerCase().includes(lower)   ||
      o.buildingName.toLowerCase().includes(lower) ||
      String(o.floorNumber).includes(lower)
  );
}

export function filterStaff(list: StaffWithContext[], q: string): StaffWithContext[] {
  if (!q) return list;
  const lower = q.toLowerCase();
  return list.filter(
    (s) =>
      s.fullName.toLowerCase().includes(lower)     ||
      s.position.toLowerCase().includes(lower)     ||
      s.officeName.toLowerCase().includes(lower)   ||
      s.roomNumber.toLowerCase().includes(lower)   ||
      s.buildingName.toLowerCase().includes(lower)
  );
}
