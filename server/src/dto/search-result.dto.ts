export interface BuildingDTO {
    id: string;
    name: string;
    isActive: boolean;
    code: string;
    entranceLatitude: number;
    entranceLongitude: number;
    entranceImage: string | null;
    coverImage: string | null;
    entranceRoadNodeId?: string | null;
}

export interface FloorDTO {
    id: string;
    floorNumber: number;
    buildingId: string;
}

export interface OfficeDTO {
    id: string;
    name: string;
    roomNumber: string;
    description: string | null;
    floorId: string;
    isActive: boolean;
}

export interface StaffDTO {
    id: string;
    fullName: string;
    position: string;
    email: string | null;
    phone: string | null;
    officeId: string;
    isActive: boolean;
}

export interface SceneDTO {
    id: string;
    key: string;
    name: string;
    imagePath: string;
    imageFilename: string | null;
    displayOrder: number;
    isEntryScene: boolean;
    floorId: string;
}

export interface SearchResultDTO {
    type: "staff" | "office";
    building: BuildingDTO;
    floor: FloorDTO;
    office: OfficeDTO;
    staff: StaffDTO | null;
    entryScene: SceneDTO | null;
    destinationScene: SceneDTO | null;
}

function omitTimestamps<T>(obj: T): any {
    if (!obj) return null;
    const { createdAt, updatedAt, ...rest } = obj as any;
    return rest;
}

export function mapToSearchResultDTO(
    type: "staff" | "office",
    building: any,
    floor: any,
    office: any,
    staff: any | null,
    entryScene: any | null,
    destinationScene: any | null
): SearchResultDTO {
    return {
        type,
        building: omitTimestamps(building) as BuildingDTO,
        floor: omitTimestamps(floor) as FloorDTO,
        office: omitTimestamps(office) as OfficeDTO,
        staff: omitTimestamps(staff) as StaffDTO | null,
        entryScene: omitTimestamps(entryScene) as SceneDTO | null,
        destinationScene: omitTimestamps(destinationScene) as SceneDTO | null,
    };
}
