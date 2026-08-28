import { prisma } from "../config/prisma.js";

interface PrismaModelClient<T> {
    findMany(args: { where?: any; include?: any; take?: number }): Promise<T[]>;
}

const SEARCH_LIMIT = 10;

const STAFF_INCLUDE = {
    office: {
        include: {
            floor: {
                include: {
                    building: true,
                },
            },
        },
    },
};

const OFFICE_INCLUDE = {
    floor: {
        include: {
            building: true,
        },
    },
};

const ALIAS_INCLUDE = {
    office: {
        include: {
            floor: {
                include: {
                    building: true,
                },
            },
        },
    },
    staff: {
        include: {
            office: {
                include: {
                    floor: {
                        include: {
                            building: true,
                        },
                    },
                },
            },
        },
    },
};

export class SearchRepository {
    private async rankedSearch<T extends { id: string }>(
        model: PrismaModelClient<T>,
        whereBase: Record<string, any>,
        searchField: string,
        query: string,
        include: Record<string, any>
    ): Promise<T[]> {
        const exact = await model.findMany({
            where: {
                ...whereBase,
                [searchField]: { equals: query, mode: "insensitive" },
            },
            include,
            take: SEARCH_LIMIT,
        });

        if (exact.length >= SEARCH_LIMIT) return exact;

        const startsWith = await model.findMany({
            where: {
                ...whereBase,
                [searchField]: { startsWith: query, mode: "insensitive" },
            },
            include,
            take: SEARCH_LIMIT,
        });

        const contains = await model.findMany({
            where: {
                ...whereBase,
                [searchField]: { contains: query, mode: "insensitive" },
            },
            include,
            take: SEARCH_LIMIT,
        });

        const merged = [...exact, ...startsWith, ...contains];
        const unique = merged.filter((item, index, self) =>
            self.findIndex(t => t.id === item.id) === index
        );
        return unique.slice(0, SEARCH_LIMIT);
    }

    async findStaffByName(normalizedQuery: string) {
        return this.rankedSearch<any>(
            prisma.staff,
            {
                isActive: true,
                office: { isActive: true },
            },
            "fullName",
            normalizedQuery,
            STAFF_INCLUDE
        );
    }

    async findStaffByPosition(normalizedQuery: string) {
        return this.rankedSearch<any>(
            prisma.staff,
            {
                isActive: true,
                office: { isActive: true },
            },
            "position",
            normalizedQuery,
            STAFF_INCLUDE
        );
    }

    async findOfficeByName(normalizedQuery: string) {
        return this.rankedSearch<any>(
            prisma.office,
            { isActive: true },
            "name",
            normalizedQuery,
            OFFICE_INCLUDE
        );
    }

    async findOfficeByRoomNumber(normalizedQuery: string) {
        return this.rankedSearch<any>(
            prisma.office,
            { isActive: true },
            "roomNumber",
            normalizedQuery,
            OFFICE_INCLUDE
        );
    }

    async findAlias(normalizedQuery: string) {
        const activeFilter = {
            OR: [
                {
                    staff: {
                        isActive: true,
                        office: {
                            isActive: true,
                        },
                    },
                },
                {
                    office: {
                        isActive: true,
                    },
                },
            ],
        };

        return this.rankedSearch<any>(
            prisma.searchAlias,
            activeFilter,
            "normalizedAlias",
            normalizedQuery,
            ALIAS_INCLUDE
        );
    }

    async findEntryScene(floorId: string) {
        // 1st Priority: Entry scene on this target floor
        const floorEntryScene = await prisma.panoramaScene.findFirst({
            where: {
                floorId,
                isEntryScene: true,
            },
        });
        if (floorEntryScene) return floorEntryScene;

        // 2nd Priority: Any scene on this target floor
        const anyFloorScene = await prisma.panoramaScene.findFirst({
            where: { floorId },
            orderBy: { displayOrder: "asc" },
        });
        if (anyFloorScene) return anyFloorScene;

        // 3rd Priority: Entrance scene of the building (e.g. Ground floor entry scene)
        const floor = await prisma.floor.findUnique({
            where: { id: floorId },
            select: { buildingId: true },
        });
        if (floor?.buildingId) {
            const buildingEntryScene = await prisma.panoramaScene.findFirst({
                where: {
                    floor: { buildingId: floor.buildingId },
                    isEntryScene: true,
                },
            });
            if (buildingEntryScene) return buildingEntryScene;

            // 4th Priority: Any scene in the building
            const anyBuildingScene = await prisma.panoramaScene.findFirst({
                where: {
                    floor: { buildingId: floor.buildingId },
                },
                orderBy: { displayOrder: "asc" },
            });
            if (anyBuildingScene) return anyBuildingScene;
        }

        // 5th Priority: Global default entry scene
        return prisma.panoramaScene.findFirst({
            orderBy: [{ isEntryScene: "desc" }, { createdAt: "asc" }],
        });
    }

    async findOfficeScene(officeId: string) {
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
}
