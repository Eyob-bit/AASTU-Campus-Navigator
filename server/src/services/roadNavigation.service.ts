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

type GraphNode = Awaited<ReturnType<typeof roadNodeRepo.findGraphNodes>>[number];

const DEG_TO_RAD = Math.PI / 180;
// Cap on cached graph paths. The campus has a small node count, so this covers
// essentially every realistic origin/destination pair.
const MAX_CACHED_PATHS = 128;

interface CachedGraph {
  nodes: GraphNode[];
  nodeMap: Map<string, GraphNode>;
  adj: Map<string, Array<{ toId: string; distance: number }>>;
  /** Cached graph-only paths keyed `startNodeId:destNodeId`. */
  pathCache: Map<string, string[]>;
}

let graphCache: CachedGraph | null = null;
// In-flight load, so concurrent cache misses share one round trip to the database.
let graphLoadPromise: Promise<CachedGraph> | null = null;
// Incremented on every invalidation. A load that finishes after its generation has been
// superseded discards its result rather than caching data that is already stale.
let graphGeneration = 0;

export class RoadNavigationService {
  /**
   * Invalidate cached road network graph (called when nodes/edges are added, edited, or deleted).
   */
  static invalidateGraphCache(): void {
    graphCache = null;
    graphLoadPromise = null;
    graphGeneration += 1;
  }

  /**
   * Load the graph into memory ahead of the first request so nobody pays cold-start cost.
   */
  static async warmGraphCache(): Promise<void> {
    try {
      await new RoadNavigationService().getGraph();
    } catch (err) {
      console.warn("[RoadNavigationService] Graph cache warm-up failed:", err);
    }
  }

  /**
   * Loads or returns the cached graph representation.
   *
   * There is no TTL: every node and edge mutation already calls `invalidateGraphCache`,
   * so expiring on a timer only forced needless reloads of a graph that hadn't changed.
   */
  private async getGraph(): Promise<CachedGraph> {
    if (graphCache) return graphCache;
    if (graphLoadPromise) return graphLoadPromise;

    const generation = graphGeneration;

    graphLoadPromise = (async () => {
      const [allNodes, allEdges] = await Promise.all([
        roadNodeRepo.findGraphNodes(),
        roadEdgeRepo.findGraphEdges(),
      ]);

      const nodeMap = new Map<string, GraphNode>();
      const adj = new Map<string, Array<{ toId: string; distance: number }>>();

      for (const node of allNodes) {
        nodeMap.set(node.id, node);
        adj.set(node.id, []);
      }

      for (const edge of allEdges) {
        if (edge.isWalkable === false) continue;

        let from = adj.get(edge.fromNodeId);
        if (!from) {
          from = [];
          adj.set(edge.fromNodeId, from);
        }
        from.push({ toId: edge.toNodeId, distance: edge.distance });

        if (edge.isBidirectional) {
          let to = adj.get(edge.toNodeId);
          if (!to) {
            to = [];
            adj.set(edge.toNodeId, to);
          }
          to.push({ toId: edge.fromNodeId, distance: edge.distance });
        }
      }

      const graph: CachedGraph = {
        nodes: allNodes,
        nodeMap,
        adj,
        pathCache: new Map(),
      };

      // Only publish if no invalidation landed while this load was in flight; the
      // caller still gets this graph, it just doesn't become the cached one.
      if (generation === graphGeneration) {
        graphCache = graph;
        graphLoadPromise = null;
      }
      return graph;
    })().catch((err) => {
      if (generation === graphGeneration) {
        graphLoadPromise = null;
      }
      throw err;
    });

    return graphLoadPromise;
  }

  /**
   * Finds the graph node closest to a coordinate.
   *
   * A linear scan, but with the trigonometry hoisted out: `cosLat` is computed once per
   * query instead of the four trig calls plus `atan2` that Haversine needed per node.
   * At campus scale that reduces this from the most expensive part of a route request
   * to a rounding error, without the correctness traps of a spatial index.
   */
  private findNearestNode(graph: CachedGraph, lat: number, lng: number): GraphNode {
    const { nodes } = graph;
    const cosLat = Math.cos(lat * DEG_TO_RAD);

    let best = nodes[0];
    let bestDistSq = Infinity;

    for (const node of nodes) {
      const dLat = node.latitude - lat;
      const dLng = (node.longitude - lng) * cosLat;
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = node;
      }
    }

    return best;
  }

  /**
   * A* over the road graph with a binary min-heap and an admissible Haversine heuristic.
   * Time Complexity: O((V + E) log V)
   */
  private findPath(graph: CachedGraph, startNode: GraphNode, destNode: GraphNode): string[] {
    const { nodeMap, adj, pathCache } = graph;

    const cacheKey = `${startNode.id}:${destNode.id}`;
    const cached = pathCache.get(cacheKey);
    if (cached) return cached;

    const pq = new PriorityQueue<string>();
    const cameFrom = new Map<string, string>();
    // Lazily populated — pre-seeding every node with Infinity costs O(V) per request
    // for no benefit, since a missing entry already means "unreached".
    const gScore = new Map<string, number>();
    const closedSet = new Set<string>();
    // h(n) is fixed for a given destination, so memoise it instead of recomputing on
    // every edge relaxation.
    const hCache = new Map<string, number>();

    const heuristic = (node: GraphNode): number => {
      const memo = hCache.get(node.id);
      if (memo !== undefined) return memo;
      const h = calculateHaversineDistance(
        node.latitude,
        node.longitude,
        destNode.latitude,
        destNode.longitude
      );
      hCache.set(node.id, h);
      return h;
    };

    gScore.set(startNode.id, 0);
    pq.push(startNode.id, heuristic(startNode));

    let reached = startNode.id === destNode.id;

    while (!pq.isEmpty()) {
      const currentId = pq.pop()!;

      if (currentId === destNode.id) {
        reached = true;
        break;
      }

      if (closedSet.has(currentId)) continue;
      closedSet.add(currentId);

      const currentG = gScore.get(currentId) ?? Infinity;
      const neighbors = adj.get(currentId);
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.toId)) continue;

        const neighborNode = nodeMap.get(neighbor.toId);
        if (!neighborNode) continue;

        const tentativeG = currentG + neighbor.distance;

        if (tentativeG < (gScore.get(neighbor.toId) ?? Infinity)) {
          cameFrom.set(neighbor.toId, currentId);
          gScore.set(neighbor.toId, tentativeG);
          pq.push(neighbor.toId, tentativeG + heuristic(neighborNode));
        }
      }
    }

    // Reconstruct the path
    let pathIds: string[];

    if (!reached && startNode.id !== destNode.id) {
      // Disconnected: fall back to a direct hop so the user still gets a bearing.
      pathIds = [startNode.id, destNode.id];
    } else {
      pathIds = [];
      let curr: string | undefined = destNode.id;
      while (curr) {
        pathIds.push(curr);
        if (curr === startNode.id) break;
        curr = cameFrom.get(curr);
      }
      pathIds.reverse();
    }

    if (pathCache.size >= MAX_CACHED_PATHS) {
      // Map preserves insertion order, so the first key is the oldest entry.
      const oldest = pathCache.keys().next().value;
      if (oldest !== undefined) pathCache.delete(oldest);
    }
    pathCache.set(cacheKey, pathIds);

    return pathIds;
  }

  /**
   * Calculates the shortest walking route along the AASTU road graph.
   */
  async calculateRoute(req: RouteRequest): Promise<RouteResponse> {
    const { startLat, startLng, destLat, destLng, destNodeId } = req;

    if (startLat == null || startLng == null || isNaN(startLat) || isNaN(startLng)) {
      throw new Error("startLat and startLng coordinates are required.");
    }

    const graph = await this.getGraph();
    const { nodes: allNodes, nodeMap } = graph;
    if (allNodes.length === 0) {
      throw new Error("No road nodes available in database.");
    }

    // 1. Nearest start node
    const startNode = this.findNearestNode(graph, startLat, startLng);

    // 2. Destination node, either explicit or nearest to the target coordinates
    let destNode: GraphNode;
    if (destNodeId) {
      const found = nodeMap.get(destNodeId);
      if (!found) {
        throw new Error(`Road node ${destNodeId} was not found.`);
      }
      destNode = found;
    } else if (destLat != null && destLng != null && !isNaN(destLat) && !isNaN(destLng)) {
      destNode = this.findNearestNode(graph, destLat, destLng);
    } else {
      throw new Error("Either destLat/destLng or destNodeId must be provided.");
    }

    // 3. Shortest path through the graph
    const pathIds = this.findPath(graph, startNode, destNode);

    const pathNodes = pathIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is GraphNode => n != null);

    if (pathNodes.length === 0) {
      throw new Error("Failed to resolve a route through the road network.");
    }

    // 4. Stitch the raw GPS origin and the true destination onto the graph path
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

    const lastNode = pathNodes[pathNodes.length - 1];
    const totalDistanceMeters = Math.round(
      calculateHaversineDistance(startLat, startLng, pathNodes[0].latitude, pathNodes[0].longitude) +
        graphDistance +
        calculateHaversineDistance(lastNode.latitude, lastNode.longitude, targetLat, targetLng)
    );

    const estimatedWalkingMinutes = Math.max(1, Math.ceil(totalDistanceMeters / 78));

    const mapNodeToInfo = (node: GraphNode): RouteNodeInfo => ({
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
