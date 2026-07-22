import { prisma } from "../config/prisma.js";

const OFFICE_NAV_INCLUDE = {
    floor: {
        include: {
            building: true,
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

    async findEntryScene(floorId: string) {
        return prisma.panoramaScene.findFirst({
            where: {
                floorId,
                isEntryScene: true,
            },
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

    async findSceneGraph(floorId: string) {
        return prisma.panoramaScene.findMany({
            where: {
                floorId,
            },
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
