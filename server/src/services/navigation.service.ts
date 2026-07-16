import { NavigationRepository } from "../repositories/navigation.repository.js";
import {
    mapToNavigationResultDTO,
    NavigationResultDTO,
    PathNodeDTO,
} from "../dto/navigation-result.dto.js";
import { ApiError } from "../utils/ApiError.js";

type SceneGraphNode = {
    id: string;
    key: string;
    name: string;
    imagePath: string;
    displayOrder: number;
    elements?: Array<{
        type: string;
        nextSceneId: string | null;
    }>;
};

export class NavigationService {
    private repository = new NavigationRepository();

    async navigate(officeId: string): Promise<NavigationResultDTO> {
        const office = await this.repository.findOfficeById(officeId);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }

        const floorId = office.floorId;

        const [entryScene, destinationScene, scenes] = await Promise.all([
            this.repository.findEntryScene(floorId),
            this.repository.findDestinationScene(officeId),
            this.repository.findSceneGraph(floorId),
        ]);

        if (!entryScene) {
            throw new ApiError(404, "Entry scene not configured");
        }

        if (!destinationScene) {
            throw new ApiError(404, "Destination scene not configured");
        }

        if (!scenes || scenes.length === 0) {
            throw new ApiError(500, "Navigation graph is invalid");
        }

        const graph = this.buildGraph(scenes);
        const parentMap = this.bfs(graph, entryScene.id, destinationScene.id);
        if (!parentMap) {
            throw new ApiError(404, "Navigation path could not be generated");
        }

        const path = this.reconstructPath(
            parentMap,
            entryScene.id,
            destinationScene.id,
            scenes
        );

        return this.createNavigationResult(
            office,
            entryScene,
            destinationScene,
            path
        );
    }

    /** Convert ARROW-linked scenes into an adjacency map for O(1) neighbor lookup. */
    private buildGraph(scenes: SceneGraphNode[]): Map<string, string[]> {
        const graph = new Map<string, string[]>();

        for (const scene of scenes) {
            const neighbors: string[] = [];

            for (const element of scene.elements || []) {
                if (element.type === "ARROW" && element.nextSceneId) {
                    neighbors.push(element.nextSceneId);
                }
            }

            graph.set(scene.id, neighbors);
        }

        return graph;
    }

    /**
     * BFS from entry → destination.
     * Returns a parent map used to reconstruct the shortest path, or null if unreachable.
     */
    private bfs(
        graph: Map<string, string[]>,
        startId: string,
        endId: string
    ): Map<string, string> | null {
        if (startId === endId) {
            return new Map();
        }

        const queue: string[] = [startId];
        let index = 0;
        const visited = new Set<string>([startId]);
        const parentMap = new Map<string, string>();

        while (index < queue.length) {
            const current = queue[index++];

            const neighbors = graph.get(current) || [];
            for (const neighbor of neighbors) {
                if (visited.has(neighbor)) continue;

                visited.add(neighbor);
                parentMap.set(neighbor, current);

                if (neighbor === endId) {
                    return parentMap;
                }

                queue.push(neighbor);
            }
        }

        return null;
    }

    /** Walk parent links from destination back to entry, then reverse. */
    private reconstructPath(
        parentMap: Map<string, string>,
        startId: string,
        endId: string,
        scenes: SceneGraphNode[]
    ): PathNodeDTO[] {
        const pathIds: string[] = [];
        let current: string | undefined = endId;

        while (current) {
            pathIds.push(current);
            if (current === startId) break;
            current = parentMap.get(current);
        }

        if (pathIds[pathIds.length - 1] !== startId) {
            throw new ApiError(404, "Navigation path could not be generated");
        }

        pathIds.reverse();

        const scenesById = new Map(scenes.map((scene) => [scene.id, scene]));

        return pathIds.map((id) => {
            const scene = scenesById.get(id);
            if (!scene) {
                throw new ApiError(500, "Navigation graph is invalid");
            }

            return {
                id: scene.id,
                key: scene.key,
                name: scene.name,
                imagePath: scene.imagePath,
                displayOrder: scene.displayOrder,
            };
        });
    }

    private createNavigationResult(
        office: any,
        entryScene: any,
        destinationScene: any,
        path: PathNodeDTO[]
    ): NavigationResultDTO {
        return mapToNavigationResultDTO(
            office.floor.building,
            office.floor,
            office,
            entryScene,
            destinationScene,
            path
        );
    }
}
