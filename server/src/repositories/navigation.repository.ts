import { prisma } from "../config/prisma.js";

const OFFICE_NAV_INCLUDE = {
    floor: {
        include: {
            building: {
                include: {
                    complex: true,
                    entrances: {
                        include: {
                            roadNode: true,
                        },
                    },
                },
            },
        },
    },
};

const SCENE_GRAPH_INCLUDE = {
    elements: {
        where: {
            type: "ARROW" as const,
        },
        include: {
            nextScene: true,
        },
    },
};

export class NavigationRepository {
    async findOfficeById(officeId: string) {
        return prisma.office.findFirst({
            where: {
                id: officeId,
                isActive: true,
            },
            include: OFFICE_NAV_INCLUDE,
        });
    }

    async findEntryScene(floorId: string, buildingId?: string) {
        // Priority 1: Entry scene on the exact destination floor
        const floorEntry = await prisma.panoramaScene.findFirst({
            where: {
                floorId,
                isEntryScene: true,
            },
        });
        if (floorEntry) return floorEntry;

        // Priority 2: Entry scene for this physical building block (e.g. Ground Floor)
        if (buildingId) {
            const buildingEntry = await prisma.panoramaScene.findFirst({
                where: {
                    floor: { buildingId },
                    isEntryScene: true,
                },
            });
            if (buildingEntry) return buildingEntry;
        }

        // Priority 3: Any scene on the target floor
        return prisma.panoramaScene.findFirst({
            where: { floorId },
            orderBy: { displayOrder: "asc" },
        });
    }

    async findDestinationScene(officeId: string) {
        const element = await prisma.sceneElement.findFirst({
            where: {
                type: "OFFICE_LABEL",
                officeId,
            },
            include: {
                scene: true,
            },
        });
        return element?.scene ?? null;
    }

    async findSceneGraph(floorId: string, buildingId?: string, complexId?: string | null) {
        // If buildingId is provided, query all scenes in this physical block or connected complex
        // so that stairs, elevators, and bridge transitions are fully included in the BFS graph
        const whereClause: any = complexId
            ? {
                floor: {
                    building: {
                        OR: [{ id: buildingId }, { complexId }],
                    },
                },
            }
            : buildingId
            ? { floor: { buildingId } }
            : { floorId };

        return prisma.panoramaScene.findMany({
            where: whereClause,
            include: SCENE_GRAPH_INCLUDE,
        });
    }

    async findSceneById(sceneId: string) {
        return prisma.panoramaScene.findUnique({
            where: {
                id: sceneId,
            },
        });
    }
}
