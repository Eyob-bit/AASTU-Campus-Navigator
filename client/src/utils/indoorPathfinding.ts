import type { PanoramaScene, DestinationTarget, SceneElement } from "@/types";

export interface IndoorNavigationStep {
  /** True when a valid target destination exists and a route is active on this floor */
  isRouteActive: boolean;
  /** The target office scene ID on this floor */
  destinationSceneId: string | null;
  /** The exact nextSceneId that the user should navigate to from current scene */
  nextSceneId: string | null;
  /** The specific ARROW SceneElement ID that leads to nextSceneId */
  nextElementId: string | null;
  /** Alias for nextSceneId to highlight in scene viewers */
  highlightedNextSceneId: string | null;
  /** Alias for nextElementId to highlight in scene viewers */
  highlightedElementId: string | null;
  /** True if the user is already in the destination office scene */
  isAtDestination: boolean;
  /** True if the target destination belongs to a different floor or building */
  isCrossFloor: boolean;
  /** The floor number where the destination is located (if cross-floor) */
  targetFloorNumber?: number;
  /** Target building name if known */
  targetBuildingName?: string;
  /** True if a destination office was specified on this floor, but no connected path was found */
  noRouteFound: boolean;
  /** The complete scene ID path from current scene to destination */
  path: string[];
}


/**
 * Searches scenes strictly belonging to the current floor to find the scene containing
 * the target office marker (OFFICE_LABEL element).
 */
export function findDestinationSceneId(
  floorScenes: PanoramaScene[],
  target: DestinationTarget | null
): string | null {
  if (!target || !floorScenes || floorScenes.length === 0) return null;

  const targetOfficeId =
    target.officeId ||
    (target.type === "OFFICE" ? target.id : null) ||
    (target.type === "STAFF" ? target.officeId : null);

  const targetRoom = target.roomNumber?.trim().toLowerCase();
  const targetOfficeName = target.officeName?.trim().toLowerCase();
  const targetName = target.name?.trim().toLowerCase();

  // 1. Direct match on officeId / targetOfficeId
  if (targetOfficeId) {
    for (const scene of floorScenes) {
      const elements: SceneElement[] = scene.elements || [];
      const match = elements.find(
        (el) =>
          el.type === "OFFICE_LABEL" &&
          (el.officeId === targetOfficeId || el.targetOfficeId === targetOfficeId)
      );
      if (match) return scene.id;
    }
  }

  // 2. Exact match on room number in label
  if (targetRoom) {
    for (const scene of floorScenes) {
      const elements: SceneElement[] = scene.elements || [];
      const match = elements.find(
        (el) =>
          el.type === "OFFICE_LABEL" &&
          el.label &&
          (el.label.trim().toLowerCase() === targetRoom ||
            el.label.toLowerCase().includes(`room ${targetRoom}`) ||
            el.label.toLowerCase().includes(targetRoom))
      );
      if (match) return scene.id;
    }
  }

  // 3. Match on office name or target name in label
  if (targetOfficeName || targetName) {
    const searchName = targetOfficeName || targetName;
    for (const scene of floorScenes) {
      const elements: SceneElement[] = scene.elements || [];
      const match = elements.find(
        (el) =>
          el.type === "OFFICE_LABEL" &&
          el.label &&
          (el.label.toLowerCase().includes(searchName!) ||
            searchName!.includes(el.label.toLowerCase()))
      );
      if (match) return scene.id;
    }
  }

  return null;
}

/**
 * Builds an adjacency list representation of the floor's panorama graph strictly using
 * SceneElement.nextSceneId links on ARROW elements.
 */
export function buildFloorSceneGraph(
  floorScenes: PanoramaScene[]
): Map<string, Array<{ nextSceneId: string; elementId: string }>> {
  const graph = new Map<string, Array<{ nextSceneId: string; elementId: string }>>();

  for (const scene of floorScenes) {
    const edges: Array<{ nextSceneId: string; elementId: string }> = [];
    const elements: SceneElement[] = scene.elements || [];

    for (const el of elements) {
      if (el.type === "ARROW" && el.nextSceneId && el.isVisible !== false) {
        edges.push({
          nextSceneId: el.nextSceneId,
          elementId: el.id,
        });
      }
    }
    graph.set(scene.id, edges);
  }

  return graph;
}

/**
 * Calculates the exact next arrow step using Breadth-First Search (BFS) on the floor scene graph.
 * Strict rules:
 * - Scoped strictly to the target floor.
 * - Highlighted arrow is determined strictly by element.nextSceneId === nextHopSceneId on the shortest route.
 * - Never guesses if cross-floor or if no route exists.
 */
export function calculateIndoorNextStep({
  floorScenes,
  currentSceneId,
  currentFloorId,
  destinationTarget,
}: {
  floorScenes: PanoramaScene[];
  currentSceneId: string;
  currentFloorId?: string | null;
  destinationTarget: DestinationTarget | null;
}): IndoorNavigationStep {
  const emptyStep: IndoorNavigationStep = {
    isRouteActive: false,
    destinationSceneId: null,
    nextSceneId: null,
    nextElementId: null,
    highlightedNextSceneId: null,
    highlightedElementId: null,
    isAtDestination: false,
    isCrossFloor: false,
    noRouteFound: false,
    path: [],
  };

  if (!destinationTarget) {
    return emptyStep;
  }

  // Only indoor targets (OFFICE or STAFF) have indoor scene paths
  const isIndoorTarget =
    destinationTarget.type === "OFFICE" ||
    destinationTarget.type === "STAFF" ||
    Boolean(destinationTarget.officeId) ||
    Boolean(destinationTarget.floorId);

  if (!isIndoorTarget) {
    return emptyStep;
  }

  // Check Cross-Floor mismatch:
  // If target has a designated floorId and current scene's floor is known and different
  if (
    destinationTarget.floorId &&
    currentFloorId &&
    destinationTarget.floorId !== currentFloorId
  ) {
    return {
      ...emptyStep,
      isCrossFloor: true,
      targetFloorNumber: destinationTarget.floorNumber,
      targetBuildingName: destinationTarget.buildingName,
    };
  }

  if (!floorScenes || floorScenes.length === 0 || !currentSceneId) {
    return emptyStep;
  }

  // Find destination scene on this floor
  const destinationSceneId = findDestinationSceneId(floorScenes, destinationTarget);

  if (!destinationSceneId) {
    // If target has a different floorNumber or floorId not matching scenes, flag cross-floor
    if (
      destinationTarget.floorNumber !== undefined &&
      destinationTarget.floorId &&
      currentFloorId &&
      destinationTarget.floorId !== currentFloorId
    ) {
      return {
        ...emptyStep,
        isCrossFloor: true,
        targetFloorNumber: destinationTarget.floorNumber,
        targetBuildingName: destinationTarget.buildingName,
      };
    }
    return {
      ...emptyStep,
      noRouteFound: true,
    };
  }

  // If already at the destination scene
  if (currentSceneId === destinationSceneId) {
    return {
      isRouteActive: true,
      destinationSceneId,
      nextSceneId: null,
      nextElementId: null,
      highlightedNextSceneId: null,
      highlightedElementId: null,
      isAtDestination: true,
      isCrossFloor: false,
      noRouteFound: false,
      path: [currentSceneId],
    };
  }

  // Build the topological graph from nextSceneId edges
  const graph = buildFloorSceneGraph(floorScenes);

  // BFS search from currentSceneId to destinationSceneId
  const queue: string[] = [currentSceneId];
  const visited = new Set<string>([currentSceneId]);
  const parentMap = new Map<string, { prevSceneId: string; elementId: string }>();

  let found = false;
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    if (current === destinationSceneId) {
      found = true;
      break;
    }

    const neighbors = graph.get(current) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.nextSceneId)) {
        visited.add(edge.nextSceneId);
        parentMap.set(edge.nextSceneId, {
          prevSceneId: current,
          elementId: edge.elementId,
        });
        queue.push(edge.nextSceneId);
      }
    }
  }

  if (!found || !parentMap.has(destinationSceneId)) {
    return {
      isRouteActive: false,
      destinationSceneId,
      nextSceneId: null,
      nextElementId: null,
      highlightedNextSceneId: null,
      highlightedElementId: null,
      isAtDestination: false,
      isCrossFloor: false,
      noRouteFound: true,
      path: [],
    };
  }

  // Reconstruct full path
  const path: string[] = [];
  let curr: string | undefined = destinationSceneId;
  let nextHopSceneId: string | null = null;
  let nextHopElementId: string | null = null;

  while (curr) {
    path.push(curr);
    if (curr === currentSceneId) break;

    const parent = parentMap.get(curr);
    if (!parent) break;

    // The step where prevSceneId is currentSceneId is the immediate next hop
    if (parent.prevSceneId === currentSceneId) {
      nextHopSceneId = curr;
      nextHopElementId = parent.elementId;
    }

    curr = parent.prevSceneId;
  }

  path.reverse();

  return {
    isRouteActive: Boolean(nextHopSceneId),
    destinationSceneId,
    nextSceneId: nextHopSceneId,
    nextElementId: nextHopElementId,
    highlightedNextSceneId: nextHopSceneId,
    highlightedElementId: nextHopElementId,
    isAtDestination: false,
    isCrossFloor: false,
    noRouteFound: false,
    path,
  };
}
