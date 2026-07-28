import { prisma } from "../config/prisma.js";

export class SceneRepository {
    async findAllByFloor(floorId: string) {
        return prisma.panoramaScene.findMany({
            where: {
                floorId,
            },
            include: {
                elements: true,
            },
            orderBy: {
                displayOrder: "asc",
            },
        });
    }

    async findById(id: string) {
        return prisma.panoramaScene.findUnique({
            where: {
                id,
            },
        });
    }

    async findByKey(key: string) {
        return prisma.panoramaScene.findUnique({
            where: {
                key,
            },
        });
    }

    async findByFloorAndName(floorId: string, name: string) {
        return prisma.panoramaScene.findFirst({
            where: {
                floorId,
                name: {
                    equals: name,
                    mode: "insensitive",
                },
            },
        });
    }

    async findByFloorAndDisplayOrder(floorId: string, displayOrder: number) {
        return prisma.panoramaScene.findFirst({
            where: {
                floorId,
                displayOrder,
            },
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

    async findFirstDefaultScene() {
        const entry = await prisma.panoramaScene.findFirst({
            where: { isEntryScene: true },
            orderBy: { createdAt: "asc" },
        });
        if (entry) return entry;
        return prisma.panoramaScene.findFirst({
            orderBy: { createdAt: "asc" },
        });
    }

    async findByIdWithDetails(id: string) {
        return prisma.panoramaScene.findUnique({
            where: {
                id,
            },
            include: {
                floor: {
                    include: {
                        building: true,
                    },
                },
                elements: {
                    orderBy: {
                        displayOrder: "asc",
                    },
                    include: {
                        office: true,
                        nextScene: true,
                    },
                },
                nextScenes: true,
            },
        });
    }

    async create(data: {
        name: string;
        key: string;
        imagePath: string;
        imageFilename?: string | null;
        displayOrder?: number;
        isEntryScene?: boolean;
        floorId: string;
    }) {
        return prisma.panoramaScene.create({
            data: {
                name: data.name,
                key: data.key,
                imagePath: data.imagePath,
                imageFilename: data.imageFilename,
                displayOrder: data.displayOrder ?? 0,
                isEntryScene: data.isEntryScene ?? false,
                floorId: data.floorId,
            },
        });
    }

    async createSceneWithEntrySwitch(
        data: {
            name: string;
            key: string;
            imagePath: string;
            imageFilename?: string | null;
            displayOrder?: number;
            isEntryScene?: boolean;
            floorId: string;
        },
        oldEntrySceneId: string | null
    ) {
        if (!oldEntrySceneId) {
            return this.create(data);
        }

        return prisma.$transaction([
            prisma.panoramaScene.update({
                where: { id: oldEntrySceneId },
                data: { isEntryScene: false },
            }),
            prisma.panoramaScene.create({
                data: {
                    name: data.name,
                    key: data.key,
                    imagePath: data.imagePath,
                    imageFilename: data.imageFilename,
                    displayOrder: data.displayOrder ?? 0,
                    isEntryScene: data.isEntryScene ?? false,
                    floorId: data.floorId,
                },
            }),
        ]).then((results) => results[1]);
    }

    async update(
        id: string,
        data: {
            name?: string;
            key?: string;
            imagePath?: string;
            imageFilename?: string | null;
            displayOrder?: number;
            isEntryScene?: boolean;
        }
    ) {
        return prisma.panoramaScene.update({
            where: {
                id,
            },
            data,
        });
    }

    async updateSceneWithEntrySwitch(
        id: string,
        data: {
            name?: string;
            key?: string;
            imagePath?: string;
            imageFilename?: string | null;
            displayOrder?: number;
            isEntryScene?: boolean;
        },
        oldEntrySceneId: string | null
    ) {
        if (!oldEntrySceneId) {
            return this.update(id, data);
        }

        return prisma.$transaction([
            prisma.panoramaScene.update({
                where: { id: oldEntrySceneId },
                data: { isEntryScene: false },
            }),
            prisma.panoramaScene.update({
                where: { id },
                data,
            }),
        ]).then((results) => results[1]);
    }

    async delete(id: string) {
        return prisma.panoramaScene.delete({
            where: {
                id,
            },
        });
    }
}
