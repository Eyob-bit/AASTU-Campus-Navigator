export interface Building {
  id: string;
  name: string;
  code: string;
  entranceLatitude: number;
  entranceLongitude: number;
  entranceImage: string | null;
  coverImage: string | null;
  entranceRoadNodeId?: string | null;
  isActive: boolean;
  floors?: Floor[];
}

export interface Floor {
  id: string;
  floorNumber: number;
  buildingId: string;
}

export interface Office {
  id: string;
  name: string;
  roomNumber: string;
  description: string | null;
  floorId: string;
  isActive: boolean;
}

export interface Staff {
  id: string;
  fullName: string;
  position: string;
  email: string | null;
  phone: string | null;
  officeId: string;
  isActive: boolean;
}

export interface Scene {
  id: string;
  key: string;
  name: string;
  imagePath: string;
  imageFilename: string | null;
  displayOrder: number;
  isEntryScene: boolean;
  floorId: string;
}

export interface PathNode {
  id: string;
  key: string;
  name: string;
  imagePath: string;
  displayOrder: number;
}

export type SearchResultType = "office" | "staff";

export type DestinationType = "BUILDING" | "LANDMARK" | "OFFICE" | "STAFF";

export type NavStep =
  | "IDLE"
  | "OUTDOOR_NAV"
  | "ARRIVAL_BOTSHEET"
  | "BUILDING_TRANSITION"
  | "INDOOR_GUIDANCE"
  | "INDOOR_PANORAMA"
  | "DESTINATION_REACHED";

export interface DestinationTarget {
  id: string;
  type: DestinationType;
  name: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
  roadNodeId?: string | null;
  buildingId?: string;
  buildingName?: string;
  buildingCode?: string;
  floorId?: string;
  floorNumber?: number;
  officeId?: string;
  officeName?: string;
  roomNumber?: string;
  staffId?: string;
  staffName?: string;
  staffPosition?: string;
  staffPhone?: string | null;
  staffEmail?: string | null;
  entranceImage?: string | null;
  entrySceneId?: string | null;
}

export interface SearchResult {
  type: SearchResultType;
  building: Building;
  floor: Floor;
  office: Office;
  staff: Staff | null;
  entryScene: Scene | null;
  destinationScene: Scene | null;
}

export interface NavigationResult {
  building: Building;
  floor: Floor;
  office: Office;
  entryScene: Scene;
  destinationScene: Scene;
  path: PathNode[];
}
