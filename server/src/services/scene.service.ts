import { SceneRepository } from "../repositories/scene.repository.js";
import { FloorRepository } from "../repositories/floor.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFile } from "../utils/file.util.js";
import path from "path";

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
            displayOrder?: number;
            isEntryScene?: boolean;
        },
        file: Express.Multer.File
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

        const imageFilename = file.filename;
        const imagePath = `uploads/panoramas/${imageFilename}`;

        return this.repository.createSceneWithEntrySwitch(
            {
                ...data,
                imageFilename,
                imagePath,
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
            displayOrder?: number;
            isEntryScene?: boolean;
        },
        file?: Express.Multer.File
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

        let imagePath = scene.imagePath;
        let imageFilename = scene.imageFilename;

        if (file) {
            imageFilename = file.filename;
            imagePath = `uploads/panoramas/${imageFilename}`;
        }

        const updatedScene = await this.repository.updateSceneWithEntrySwitch(
            id,
            {
                ...data,
                imagePath,
                imageFilename,
            },
            oldEntrySceneId
        );

        // Delete old image only after the database has successfully updated
        if (file) {
            if (scene.imageFilename) {
                await deleteFile(path.join("uploads", "panoramas", scene.imageFilename)).catch((err) =>
                    console.error("Failed to delete old image after database update:", err)
                );
            } else if (scene.imagePath) {
                await deleteFile(scene.imagePath).catch((err) =>
                    console.error("Failed to delete old image path after database update:", err)
                );
            }
        }

        return updatedScene;
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

        // Delete physical file
        if (scene.imageFilename) {
            await deleteFile(path.join("uploads", "panoramas", scene.imageFilename));
        } else if (scene.imagePath) {
            await deleteFile(scene.imagePath);
        }

        return this.repository.delete(id);
    }
}
