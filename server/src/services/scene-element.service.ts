import { SceneElementRepository } from "../repositories/scene-element.repository.js";
import { SceneRepository } from "../repositories/scene.repository.js";
import { OfficeRepository } from "../repositories/office.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { SceneElementType, PanoramaScene } from "@prisma/client";

export class SceneElementService {
    private repository = new SceneElementRepository();
    private sceneRepository = new SceneRepository();
    private officeRepository = new OfficeRepository();

    async getElementsByScene(sceneId: string) {
        const scene = await this.sceneRepository.findById(sceneId);
        if (!scene) {
            throw new ApiError(404, "Scene not found");
        }
        return this.repository.findAllByScene(sceneId);
    }

    async getElementById(id: string) {
        const element = await this.repository.findByIdWithDetails(id);
        if (!element) {
            throw new ApiError(404, "Scene element not found");
        }
        return element;
    }

    async createElement(
        sceneId: string,
        data: {
            type: SceneElementType;
            x: number;
            y: number;
            rotation?: number | null;
            displayOrder: number;
            isVisible?: boolean;
            label?: string | null;
            officeId?: string | null;
            nextSceneId?: string | null;
        }
    ) {
        const scene = await this.sceneRepository.findById(sceneId);

        if (!scene) {
            throw new ApiError(404, "Scene not found");
        }

        const maxOrderEl = await this.repository.findMaxDisplayOrder(sceneId);
        const nextOrder = (maxOrderEl?.displayOrder ?? -1) + 1;

        if (data.displayOrder === undefined || data.displayOrder === null) {
            data.displayOrder = nextOrder;
        } else {
            const existingOrder = await this.repository.findBySceneAndDisplayOrder(
                sceneId,
                data.displayOrder
            );
            if (existingOrder) {
                data.displayOrder = nextOrder;
            }
        }

        await this.validateBusinessRules(scene, data);

        return this.repository.create({
            ...data,
            sceneId,
        });
    }

    async updateElement(
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
        const element = await this.repository.findById(id);
        if (!element) {
            throw new ApiError(404, "Scene element not found");
        }

        if (data.displayOrder !== undefined && data.displayOrder !== element.displayOrder) {
            const existingOrder = await this.repository.findBySceneAndDisplayOrder(
                element.sceneId,
                data.displayOrder
            );
            if (existingOrder) {
                throw new ApiError(400, "Display order already exists in this scene");
            }
        }

        const merged = {
            type: data.type ?? element.type,
            label: data.label !== undefined ? data.label : element.label,
            officeId: data.officeId !== undefined ? data.officeId : element.officeId,
            nextSceneId: data.nextSceneId !== undefined ? data.nextSceneId : element.nextSceneId,
        };

        const scene = await this.sceneRepository.findById(element.sceneId);

        if (!scene) {
            throw new ApiError(404, "Scene not found");
        }

        await this.validateBusinessRules(scene, merged);

        const updatePayload: typeof data = { ...data };
        if (merged.type === "ARROW") {
            updatePayload.officeId = null;
        } else if (merged.type === "OFFICE_LABEL") {
            updatePayload.nextSceneId = null;
        } else if (merged.type === "INFORMATION") {
            updatePayload.officeId = null;
            updatePayload.nextSceneId = null;
        }

        return this.repository.update(id, updatePayload);
    }

    async deleteElement(id: string) {
        const element = await this.repository.findById(id);
        if (!element) {
            throw new ApiError(404, "Scene element not found");
        }
        return this.repository.delete(id);
    }

    private async validateBusinessRules(
        currentScene: PanoramaScene,
        data: {
            type: SceneElementType;
            label?: string | null;
            officeId?: string | null;
            nextSceneId?: string | null;
        }
    ) {

        if (data.type === "ARROW") {
            if (!data.nextSceneId) {
                throw new ApiError(400, "ARROW element must have nextSceneId");
            }
            if (data.officeId) {
                throw new ApiError(400, "ARROW element must NOT have officeId");
            }
            if (data.nextSceneId === currentScene.id) {
                throw new ApiError(400, "ARROW element cannot point to the same scene");
            }

            const nextScene = await this.sceneRepository.findById(data.nextSceneId);
            if (!nextScene) {
                throw new ApiError(400, "Referenced destination scene must exist");
            }
            if (nextScene.floorId !== currentScene.floorId) {
                throw new ApiError(
                    400,
                    "Destination scene must belong to the same floor."
                );
            }
        } else if (data.type === "OFFICE_LABEL") {
            if (!data.officeId) {
                throw new ApiError(400, "OFFICE_LABEL element must have officeId");
            }
            if (data.nextSceneId) {
                throw new ApiError(400, "OFFICE_LABEL element must NOT have nextSceneId");
            }

            const office = await this.officeRepository.findById(data.officeId);
            if (!office || !office.isActive) {
                throw new ApiError(400, "Referenced office must exist and be active");
            }
            if (office.floorId !== currentScene.floorId) {
                throw new ApiError(
                    400,
                    "Referenced office must belong to the same floor as the scene."
                );
            }
        } else if (data.type === "INFORMATION") {
            if (!data.label || data.label.trim() === "") {
                throw new ApiError(400, "INFORMATION element must have a label");
            }
            if (data.officeId) {
                throw new ApiError(400, "INFORMATION element cannot reference officeId");
            }
            if (data.nextSceneId) {
                throw new ApiError(400, "INFORMATION element cannot reference nextSceneId");
            }
        }
    }
}
