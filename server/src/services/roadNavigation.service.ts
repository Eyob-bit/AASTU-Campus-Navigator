import { RoadNodeRepository } from "../repositories/roadNode.repository.js";
import { RoadEdgeRepository } from "../repositories/roadEdge.repository.js";
import { calculateHaversineDistance } from "../utils/haversine.js";
import { PriorityQueue } from "../utils/priorityQueue.js";
import {
  generateRouteInstructions,
  type RouteInstruction,
} from "../utils/navigationInstructions.js";

export interface RouteRequest {
  startLat: number;
  startLng: number;
  destLat?: number;
  destLng?: number;
  destNodeId?: string;
}

export interface RouteNodeInfo {
  id: string;
  name: string | null;
  type: string;
  zone: string | null;
  latitude: number;
  longitude: number;
  buildingId?: string | null;
  buildingName?: string | null;
}

export interface RouteResponse {
  coordinates: [number, number][];
  totalDistanceMeters: number;
  estimatedWalkingMinutes: number;
  startNode: RouteNodeInfo;
  destNode: RouteNodeInfo;
  pathNodes: RouteNodeInfo[];
  instructions: RouteInstruction[];
}

const roadNodeRepo = new RoadNodeRepository();
const roadEdgeRepo = new RoadEdgeRepository();

// In-memory graph cache to prevent DB queries on every GPS tick / reroute request
interface CachedGraph {
  nodes: Awaited<ReturnType<typeof roadNodeRepo.findAll>>;
  nodeMap: Map<string, Awaited<ReturnType<typeof roadNodeRepo.findAll>>[0]>;
  adj: Map<string, Array<{ toId: string; distance: number }>>;
  cachedAt: number;
}

let graphCache: CachedGraph | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute TTL, invalidated on admin edits

export class RoadNavigationService {
  /**
   * Invalidate cached road network graph (called when nodes/edges are added, edited, or deleted).
   */
  static invalidateGraphCache(): void {
    graphCache = null;
  }

  /**
   * Loads or returns cached graph representation.
   */
  private async getGraph(): Promise<CachedGraph> {
    const now = Date.now();
    if (graphCache && now - graphCache.cachedAt < CACHE_TTL_MS) {
      return graphCache;
    }

    const allNodes = await roadNodeRepo.findAll();
    const allEdges = await roadEdgeRepo.findAll();
    const walkableEdges = allEdges.filter((e) => e.isWalkable !== false);

    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
    const adj = new Map<string, Array<{ toId: string; distance: number }>>();

    for (const node of allNodes) {
      adj.set(node.id, []);
    }

    for (const edge of walkableEdges) {
      if (!adj.has(edge.fromNodeId)) adj.set(edge.fromNodeId, []);
      adj.get(edge.fromNodeId)!.push({ toId: edge.toNodeId, distance: edge.distance });

      if (edge.isBidirectional) {
        if (!adj.has(edge.toNodeId)) adj.set(edge.toNodeId, []);
        adj.get(edge.toNodeId)!.push({ toId: edge.fromNodeId, distance: edge.distance });
      }
    }

    graphCache = {
      nodes: allNodes,
      nodeMap,
      adj,
      cachedAt: now,
    };

    return graphCache;
  }

  /**
   * Calculates shortest path along AASTU road graph using optimized A* pathfinding
   * with a Binary Min-Heap Priority Queue and Haversine heuristic.
   * Time Complexity: O((V + E) log V)
   */
  async calculateRoute(req: RouteRequest): Promise<RouteResponse> {
    const { startLat, startLng, destLat, destLng, destNodeId } = req;

    if (startLat == null || startLng == null) {
      throw new Error("startLat and startLng coordinates are required.");
    }

    const { nodes: allNodes, nodeMap, adj } = await this.getGraph();
    if (allNodes.length === 0) {
      throw new Error("No road nodes available in database.");
    }

    // 1. Find nearest start node
    let startNode = allNodes[0];
    let minStartDist = Infinity;
    for (const node of allNodes) {
      const d = calculateHaversineDistance(startLat, startLng, node.latitude, node.longitude);
      if (d < minStartDist) {
        minStartDist = d;
        startNode = node;
      }
    }

    // 2. Find nearest dest node (or by destNodeId)
    let destNode = allNodes[0];
    if (destNodeId) {
      const found = nodeMap.get(destNodeId);
      if (found) destNode = found;
    } else if (destLat != null && destLng != null) {
      let minDestDist = Infinity;
      for (const node of allNodes) {
        const d = calculateHaversineDistance(destLat, destLng, node.latitude, node.longitude);
        if (d < minDestDist) {
          minDestDist = d;
          destNode = node;
        }
      }
    } else {
      throw new Error("Either destLat/destLng or destNodeId must be provided.");
    }

    // 3. Optimized A* Search Algorithm using Binary Min-Heap Priority Queue
    const pq = new PriorityQueue<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const closedSet = new Set<string>();

    for (const node of allNodes) {
      gScore.set(node.id, Infinity);
    }

    gScore.set(startNode.id, 0);
    const initialH = calculateHaversineDistance(
      startNode.latitude,
      startNode.longitude,
      destNode.latitude,
      destNode.longitude
    );

    pq.push(startNode.id, initialH);

    while (!pq.isEmpty()) {
      const currentId = pq.pop()!;

      if (currentId === destNode.id) {
        break;
      }

      if (closedSet.has(currentId)) continue;
      closedSet.add(currentId);

      const currentG = gScore.get(currentId) ?? Infinity;
      const neighbors = adj.get(currentId) ?? [];

      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.toId)) continue;

        const neighborNode = nodeMap.get(neighbor.toId);
        if (!neighborNode) continue;

        const tentativeG = currentG + neighbor.distance;

        if (tentativeG < (gScore.get(neighbor.toId) ?? Infinity)) {
          cameFrom.set(neighbor.toId, currentId);
          gScore.set(neighbor.toId, tentativeG);

          // Admissible & Consistent Haversine Heuristic h(n)
          const h = calculateHaversineDistance(
            neighborNode.latitude,
            neighborNode.longitude,
            destNode.latitude,
            destNode.longitude
          );
          const f = tentativeG + h;

          pq.push(neighbor.toId, f);
        }
      }
    }

    // 5. Reconstruct Path
    const pathIds: string[] = [];
    let curr: string | undefined = destNode.id;

    if (gScore.get(destNode.id) === Infinity && startNode.id !== destNode.id) {
      pathIds.push(startNode.id, destNode.id);
    } else {
      while (curr) {
        pathIds.push(curr);
        if (curr === startNode.id) break;
        curr = cameFrom.get(curr);
      }
      pathIds.reverse();
    }

    const pathNodes = pathIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is (typeof allNodes)[0] => n != null);

    const coordinates: [number, number][] = [[startLat, startLng]];
    let graphDistance = 0;

    for (let i = 0; i < pathNodes.length; i++) {
      coordinates.push([pathNodes[i].latitude, pathNodes[i].longitude]);
      if (i > 0) {
        graphDistance += calculateHaversineDistance(
          pathNodes[i - 1].latitude,
          pathNodes[i - 1].longitude,
          pathNodes[i].latitude,
          pathNodes[i].longitude
        );
      }
    }

    const targetLat = destLat ?? destNode.latitude;
    const targetLng = destLng ?? destNode.longitude;
    coordinates.push([targetLat, targetLng]);

    const totalDistanceMeters = Math.round(
      calculateHaversineDistance(startLat, startLng, pathNodes[0].latitude, pathNodes[0].longitude) +
        graphDistance +
        calculateHaversineDistance(
          pathNodes[pathNodes.length - 1].latitude,
          pathNodes[pathNodes.length - 1].longitude,
          targetLat,
          targetLng
        )
    );

    const estimatedWalkingMinutes = Math.max(1, Math.ceil(totalDistanceMeters / 78));

    const mapNodeToInfo = (node: (typeof allNodes)[0]): RouteNodeInfo => ({
      id: node.id,
      name: node.name,
      type: node.type,
      zone: node.zone,
      latitude: node.latitude,
      longitude: node.longitude,
      buildingId: node.buildingEntrances?.[0]?.id ?? null,
      buildingName: node.buildingEntrances?.[0]?.name ?? null,
    });

    const mappedPathNodes = pathNodes.map(mapNodeToInfo);
    const destInfo = mapNodeToInfo(destNode);
    const destLabel = destInfo.buildingName || destInfo.name || undefined;
    const instructions = generateRouteInstructions(coordinates, mappedPathNodes, destLabel);

    return {
      coordinates,
      totalDistanceMeters,
      estimatedWalkingMinutes,
      startNode: mapNodeToInfo(startNode),
      destNode: destInfo,
      pathNodes: mappedPathNodes,
      instructions,
    };
  }
}

