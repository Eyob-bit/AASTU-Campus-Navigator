import {
    BuildingDTO,
    FloorDTO,
    OfficeDTO,
    SceneDTO,
} from "./search-result.dto.js";

export interface PathNodeDTO {
    id: string;
    key: string;
    name: string;
    imagePath: string;
    displayOrder: number;
}

export interface NavigationResultDTO {
    building: BuildingDTO;
    floor: FloorDTO;
    office: OfficeDTO;
    entryScene: SceneDTO;
    destinationScene: SceneDTO;
    path: PathNodeDTO[];
}

function toBuildingDTO(building: any): BuildingDTO {
    return {
        id: building.id,
        name: building.name,
        isActive: building.isActive,
        code: building.code,
        entranceLatitude: building.entranceLatitude,
        entranceLongitude: building.entranceLongitude,
        entranceImage: building.entranceImage ?? null,
        coverImage: building.coverImage ?? null,
    };
}

function toFloorDTO(floor: any): FloorDTO {
    return {
        id: floor.id,
        floorNumber: floor.floorNumber,
        buildingId: floor.buildingId,
    };
}

function toOfficeDTO(office: any): OfficeDTO {
    return {
        id: office.id,
        name: office.name,
        roomNumber: office.roomNumber,
        description: office.description ?? null,
        floorId: office.floorId,
        isActive: office.isActive,
    };
}

function toSceneDTO(scene: any): SceneDTO {
    return {
        id: scene.id,
        key: scene.key,
        name: scene.name,
        imagePath: scene.imagePath,
        imageFilename: scene.imageFilename ?? null,
        displayOrder: scene.displayOrder,
        isEntryScene: scene.isEntryScene,
        floorId: scene.floorId,
    };
}

export function mapToNavigationResultDTO(
    building: any,
    floor: any,
    office: any,
    entryScene: any,
    destinationScene: any,
    path: PathNodeDTO[]
): NavigationResultDTO {
    return {
        building: toBuildingDTO(building),
        floor: toFloorDTO(floor),
        office: toOfficeDTO(office),
        entryScene: toSceneDTO(entryScene),
        destinationScene: toSceneDTO(destinationScene),
        path,
    };
}
