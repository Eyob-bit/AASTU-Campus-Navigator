import { SceneRepository } from "../repositories/scene.repository.js";
import { FloorRepository } from "../repositories/floor.repository.js";
import { ApiError } from "../utils/ApiError.js";

export class SceneService {
    private repository = new SceneRepository();
    private floorRepository = new FloorRepository();

    async getScenesByFloor(floorId: string) {
        const floor = await this.floorRepository.findById(floorId);
        if (!floor) {
            throw new ApiError(404, "Floor not found");
        }
        return this.repository.findAllByFloor(floorId);
    }

    async getSceneById(id: string) {
        const scene = await this.repository.findByIdWithDetails(id);
        if (!scene) {
            throw new ApiError(404, "Scene not found");
        }
        return scene;
    }

    async createScene(
        floorId: string,
        data: {
            name: string;
            key: string;
            imagePath: string;
            imageFilename?: string | null;
            displayOrder?: number;
            isEntryScene?: boolean;
        }
    ) {
        const floor = await this.floorRepository.findById(floorId);
        if (!floor) {
            throw new ApiError(404, "Floor not found");
        }

        const existingKey = await this.repository.findByKey(data.key);
        if (existingKey) {
            throw new ApiError(400, "Scene key must be unique");
        }

        const existingName = await this.repository.findByFloorAndName(floorId, data.name);
        if (existingName) {
            throw new ApiError(400, "Scene name already exists on this floor");
        }

        const targetDisplayOrder = data.displayOrder ?? 0;
        const existingOrder = await this.repository.findByFloorAndDisplayOrder(
            floorId,
            targetDisplayOrder
        );
        if (existingOrder) {
            throw new ApiError(400, "Display order already exists on this floor");
        }

        const entryScene = await this.repository.findEntryScene(floorId);
        let isEntryScene = data.isEntryScene ?? false;
        let oldEntrySceneId: string | null = null;
        if (!entryScene) {
            isEntryScene = true;
        } else if (isEntryScene === true) {
            oldEntrySceneId = entryScene.id;
        }

        return this.repository.createSceneWithEntrySwitch(
            {
                ...data,
                isEntryScene,
                floorId,
            },
            oldEntrySceneId
        );
    }

    async updateScene(
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
        const scene = await this.repository.findById(id);
        if (!scene) {
            throw new ApiError(404, "Scene not found");
        }

        if (data.key !== undefined && data.key !== scene.key) {
            const existingKey = await this.repository.findByKey(data.key);
            if (existingKey) {
                throw new ApiError(400, "Scene key must be unique");
            }
        }

        if (data.name !== undefined && data.name !== scene.name) {
            const existingName = await this.repository.findByFloorAndName(scene.floorId, data.name);
            if (existingName) {
                throw new ApiError(400, "Scene name already exists on this floor");
            }
        }

        if (data.displayOrder !== undefined && data.displayOrder !== scene.displayOrder) {
            const existingOrder = await this.repository.findByFloorAndDisplayOrder(
                scene.floorId,
                data.displayOrder
            );
            if (existingOrder) {
                throw new ApiError(400, "Display order already exists on this floor");
            }
        }

        let oldEntrySceneId: string | null = null;
        if (data.isEntryScene !== undefined && data.isEntryScene !== scene.isEntryScene) {
            if (data.isEntryScene === true) {
                const entryScene = await this.repository.findEntryScene(scene.floorId);
                if (entryScene && entryScene.id !== id) {
                    oldEntrySceneId = entryScene.id;
                }
            } else if (data.isEntryScene === false && scene.isEntryScene === true) {
                const entryScene = await this.repository.findEntryScene(scene.floorId);
                if (!entryScene || entryScene.id === id) {
                    throw new ApiError(
                        400,
                        "Floor must always have one entry scene. Set another scene as the entry scene first."
                    );
                }
            }
        }

        return this.repository.updateSceneWithEntrySwitch(id, data, oldEntrySceneId);
    }

    async deleteScene(id: string) {
        const scene = await this.repository.findById(id);
        if (!scene) {
            throw new ApiError(404, "Scene not found");
        }

        if (scene.isEntryScene) {
            throw new ApiError(
                400,
                "Cannot delete the entry scene. Please set another scene as the entry scene first."
            );
        }

        return this.repository.delete(id);
    }
}
