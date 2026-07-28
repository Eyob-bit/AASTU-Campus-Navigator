import { RoadNodeRepository } from "../repositories/roadNode.repository.js";
import { RoadEdgeRepository } from "../repositories/roadEdge.repository.js";
import { calculateHaversineDistance } from "../utils/haversine.js";

export interface RouteRequest {
  startLat: number;
  startLng: number;
  destLat?: number;
  destLng?: number;
  destNodeId?: string;
}

export interface RouteResponse {
  coordinates: [number, number][];
  totalDistanceMeters: number;
  estimatedWalkingMinutes: number;
  startNode: { id: string; name: string; latitude: number; longitude: number };
  destNode: { id: string; name: string; latitude: number; longitude: number };
  pathNodes: Array<{ id: string; name: string; latitude: number; longitude: number }>;
}

const roadNodeRepo = new RoadNodeRepository();
const roadEdgeRepo = new RoadEdgeRepository();

export class RoadNavigationService {
  /**
   * Calculates shortest path along AASTU road graph using A* pathfinding with Haversine heuristic.
   */
  async calculateRoute(req: RouteRequest): Promise<RouteResponse> {
    const { startLat, startLng, destLat, destLng, destNodeId } = req;

    if (startLat == null || startLng == null) {
      throw new Error("startLat and startLng coordinates are required.");
    }

    const allNodes = await roadNodeRepo.findAll();
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
      const found = allNodes.find((n) => n.id === destNodeId);
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

    // 3. Build Adjacency Graph from database edges
    const allEdges = await roadEdgeRepo.findAll();
    const adj = new Map<string, Array<{ toId: string; distance: number }>>();

    for (const node of allNodes) {
      adj.set(node.id, []);
    }

    for (const edge of allEdges) {
      if (!adj.has(edge.fromNodeId)) adj.set(edge.fromNodeId, []);
      adj.get(edge.fromNodeId)!.push({ toId: edge.toNodeId, distance: edge.distance });

      if (edge.isBidirectional) {
        if (!adj.has(edge.toNodeId)) adj.set(edge.toNodeId, []);
        adj.get(edge.toNodeId)!.push({ toId: edge.fromNodeId, distance: edge.distance });
      }
    }

    const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

    // 4. A* Search Algorithm
    const openSet = new Set<string>([startNode.id]);
    const cameFrom = new Map<string, string>();

    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    for (const node of allNodes) {
      gScore.set(node.id, Infinity);
      fScore.set(node.id, Infinity);
    }

    gScore.set(startNode.id, 0);
    const initialH = calculateHaversineDistance(
      startNode.latitude,
      startNode.longitude,
      destNode.latitude,
      destNode.longitude
    );
    fScore.set(startNode.id, initialH);

    while (openSet.size > 0) {
      // Find node in openSet with lowest fScore
      let currentId: string | null = null;
      let minF = Infinity;

      for (const id of openSet) {
        const f = fScore.get(id) ?? Infinity;
        if (f < minF) {
          minF = f;
          currentId = id;
        }
      }

      if (!currentId) break;

      if (currentId === destNode.id) {
        // Path found!
        break;
      }

      openSet.delete(currentId);
      const currentNode = nodeMap.get(currentId)!;
      const neighbors = adj.get(currentId) ?? [];

      for (const neighbor of neighbors) {
        const neighborNode = nodeMap.get(neighbor.toId);
        if (!neighborNode) continue;

        const tentativeG = (gScore.get(currentId) ?? Infinity) + neighbor.distance;

        if (tentativeG < (gScore.get(neighbor.toId) ?? Infinity)) {
          cameFrom.set(neighbor.toId, currentId);
          gScore.set(neighbor.toId, tentativeG);

          const h = calculateHaversineDistance(
            neighborNode.latitude,
            neighborNode.longitude,
            destNode.latitude,
            destNode.longitude
          );
          fScore.set(neighbor.toId, tentativeG + h);

          if (!openSet.has(neighbor.toId)) {
            openSet.add(neighbor.toId);
          }
        }
      }
    }

    // 5. Reconstruct Path
    const pathIds: string[] = [];
    let curr: string | undefined = destNode.id;

    if (gScore.get(destNode.id) === Infinity && startNode.id !== destNode.id) {
      // Fallback direct segment if graph island exists
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

    // Build polyline coordinates: [start GPS] -> [road nodes...] -> [dest GPS]
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

    // Average walking speed ~ 1.3 meters per second (approx 80m/min)
    const estimatedWalkingMinutes = Math.max(1, Math.ceil(totalDistanceMeters / 78));

    return {
      coordinates,
      totalDistanceMeters,
      estimatedWalkingMinutes,
      startNode: {
        id: startNode.id,
        name: startNode.name,
        latitude: startNode.latitude,
        longitude: startNode.longitude,
      },
      destNode: {
        id: destNode.id,
        name: destNode.name,
        latitude: destNode.latitude,
        longitude: destNode.longitude,
      },
      pathNodes: pathNodes.map((n) => ({
        id: n.id,
        name: n.name,
        latitude: n.latitude,
        longitude: n.longitude,
      })),
    };
  }
}
