import { prisma } from "../config/prisma.js";
import { SceneElementType } from "@prisma/client";

export class SceneElementRepository {
    async findAllByScene(sceneId: string) {
        return prisma.sceneElement.findMany({
            where: {
                sceneId,
            },
            orderBy: {
                displayOrder: "asc",
            },
        });
    }

    async findById(id: string) {
        return prisma.sceneElement.findUnique({
            where: {
                id,
            },
        });
    }

    async findByIdWithDetails(id: string) {
        return prisma.sceneElement.findUnique({
            where: {
                id,
            },
            include: {
                scene: true,
                office: true,
                nextScene: true,
            },
        });
    }

    async findBySceneAndDisplayOrder(sceneId: string, displayOrder: number) {
        return prisma.sceneElement.findUnique({
            where: {
                sceneId_displayOrder: {
                    sceneId,
                    displayOrder,
                },
            },
        });
    }

    async create(data: {
        type: SceneElementType;
        x: number;
        y: number;
        rotation?: number | null;
        displayOrder: number;
        isVisible?: boolean;
        label?: string | null;
        officeId?: string | null;
        nextSceneId?: string | null;
        sceneId: string;
    }) {
        return prisma.sceneElement.create({
            data: {
                type: data.type,
                x: data.x,
                y: data.y,
                rotation: data.rotation,
                displayOrder: data.displayOrder,
                isVisible: data.isVisible ?? true,
                label: data.label,
                officeId: data.officeId,
                nextSceneId: data.nextSceneId,
                sceneId: data.sceneId,
            },
        });
    }

    async update(
        id: string,
        data: {
            type?: SceneElementType;
            x?: number;
            y?: number;
            rotation?: number | null;
            displayOrder?: number;
            isVisible?: boolean;
            label?: string | null;
            officeId?: string | null;
            nextSceneId?: string | null;
        }
    ) {
        return prisma.sceneElement.update({
            where: {
                id,
            },
            data,
        });
    }

    async delete(id: string) {
        return prisma.sceneElement.delete({
            where: {
                id,
            },
        });
    }
}
