// ─── Admin UI Types ───────────────────────────────────────────────────────────

export type ModalType = "none" | "create" | "edit" | "delete" | "view";

export interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

// ─── API Resource Types ───────────────────────────────────────────────────────

export interface Building {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  entranceLatitude: number;
  entranceLongitude: number;
  entranceImage: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  floorNumber: number;
  buildingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  id: string;
  name: string;
  roomNumber: string;
  description: string | null;
  floorId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  fullName: string;
  position: string;
  email: string | null;
  phone: string | null;
  officeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchAlias {
  id: string;
  alias: string;
  normalizedAlias: string;
  officeId: string | null;
  staffId: string | null;
  createdAt: string;
}

export interface PanoramaScene {
  id: string;
  key: string;
  name: string;
  imagePath: string;
  imageFilename: string | null;
  displayOrder: number;
  isEntryScene: boolean;
  floorId: string;
  createdAt: string;
  updatedAt: string;
  /** Included when fetched via GET /floors/:id/scenes */
  elements?: SceneElement[];
}

export type SceneElementType = "ARROW" | "OFFICE_LABEL" | "INFORMATION";

export interface SceneElement {
  id: string;
  type: SceneElementType;
  x: number;
  y: number;
  rotation: number | null;
  displayOrder: number;
  isVisible: boolean;
  label: string | null;
  sceneId: string;
  officeId: string | null;
  targetOfficeId?: string | null;
  nextSceneId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  buildingId: string;
  officeId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// ─── List Response Wrappers ───────────────────────────────────────────────────

export interface BuildingListData {
  count: number;
  buildings: Building[];
}

export interface FloorListData {
  count: number;
  floors: Floor[];
}

export interface OfficeListData {
  count: number;
  offices: Office[];
}

export interface StaffListData {
  count: number;
  staff: Staff[];
}

export interface AliasListData {
  count: number;
  aliases: SearchAlias[];
}

export interface SceneListData {
  count: number;
  scenes: PanoramaScene[];
}

export interface ElementListData {
  count: number;
  elements: SceneElement[];
}

// ─── Request Body Types ───────────────────────────────────────────────────────

export interface CreateBuildingBody {
  name: string;
  code: string;
  entranceLatitude: number;
  entranceLongitude: number;
  entranceImage?: string;
  coverImage?: string;
}

export interface UpdateBuildingBody extends Partial<CreateBuildingBody> {
  isActive?: boolean;
}

export interface CreateFloorBody {
  floorNumber: number;
}

export interface CreateOfficeBody {
  name: string;
  roomNumber: string;
  description?: string | null;
}

export interface UpdateOfficeBody extends Partial<CreateOfficeBody> {
  isActive?: boolean;
}

export interface CreateStaffBody {
  fullName: string;
  position: string;
  email?: string | null;
  phone?: string | null;
}

export interface UpdateStaffBody extends Partial<CreateStaffBody> {
  officeId?: string;
  isActive?: boolean;
}

export interface CreateAliasBody {
  alias: string;
}

export interface UpdateAliasBody {
  alias?: string;
}

// ─── Shared Hierarchy Option Types ───────────────────────────────────────────
// Used by useFloors, useOffices, useStaff and their form modals.

export interface FloorOption {
  id: string;
  floorNumber: number;
  buildingId: string;
  buildingName: string;
}

/** Floor enriched with its building name for display in the admin table */
export interface FloorWithBuilding extends Floor {
  buildingName: string;
}

export interface OfficeOption {
  id: string;
  name: string;
  roomNumber: string;
  floorId: string;
  floorNumber: number;
  buildingId: string;
  buildingName: string;
}

/** Office enriched with floor and building context for display */
export interface OfficeWithContext extends Office {
  floorNumber: number;
  buildingId: string;
  buildingName: string;
}

/** Staff enriched with full hierarchy context for display */
export interface StaffWithContext extends Staff {
  officeName: string;
  roomNumber: string;
  floorId: string;
  floorNumber: number;
  buildingId: string;
  buildingName: string;
}

export interface CreateSceneBody {
  name: string;
  key: string;
  displayOrder?: number;
  isEntryScene?: boolean;
}

export interface UpdateSceneBody extends Partial<CreateSceneBody> {}

export interface CreateSceneElementBody {
  type: SceneElementType;
  x: number;
  y: number;
  rotation?: number | null;
  displayOrder: number;
  isVisible?: boolean;
  label?: string | null;
  officeId?: string | null;
  nextSceneId?: string | null;
}

export interface UpdateSceneElementBody extends Partial<CreateSceneElementBody> {}
