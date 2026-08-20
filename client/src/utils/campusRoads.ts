/**
 * AASTU Campus Walkway & Road Network Graph for Outdoor Navigation.
 *
 * Node coordinates are placed on actual campus roads/paths as visible on
 * satellite imagery. The graph follows the real walkable route network
 * so polylines stay on roads, not cutting through buildings.
 *
 * Coordinate system: [latitude, longitude] (WGS84)
 * Campus approximate bounds: lat 8.880–8.896, lng 38.791–38.816
 */

export interface RoadNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/**
 * Key road junctions and walkway nodes on the AASTU campus road network.
 * All coordinates are placed on actual roads / paths from satellite view.
 */
export const AASTU_ROAD_NODES: RoadNode[] = [
  // ── Entrance & Main Gate area ─────────────────────────────────────────────
  { id: "main_gate",         name: "Main Campus Gate",             lat: 8.88218, lng: 38.79665 },
  { id: "gate_road_n",       name: "Gate Road North",              lat: 8.88310, lng: 38.79813 },
  { id: "gate_road_n2",      name: "Gate Road North 2",            lat: 8.88400, lng: 38.79960 },

  // ── West spine road (main N-S road on the west side) ─────────────────────
  { id: "west_spine_s",      name: "West Spine Road South",        lat: 8.88480, lng: 38.80100 },
  { id: "west_spine_c",      name: "West Spine Road Centre",       lat: 8.88620, lng: 38.80230 },
  { id: "west_spine_n",      name: "West Spine Road North",        lat: 8.88800, lng: 38.80320 },

  // ── Central loop / Admin area ─────────────────────────────────────────────
  { id: "admin_sw",          name: "Admin SW Junction",            lat: 8.88710, lng: 38.80560 },
  { id: "admin_se",          name: "Admin SE Junction",            lat: 8.88640, lng: 38.80720 },
  { id: "admin_ne",          name: "Admin NE Junction",            lat: 8.88820, lng: 38.80790 },
  { id: "admin_nw",          name: "Admin NW Junction",            lat: 8.88900, lng: 38.80620 },

  // ── Central walkway (horizontal E-W paths) ────────────────────────────────
  { id: "central_w",         name: "Central Walkway West",         lat: 8.88880, lng: 38.80890 },
  { id: "central_c",         name: "Central Walkway Centre",       lat: 8.88870, lng: 38.81020 },
  { id: "central_e",         name: "Central Walkway East",         lat: 8.88860, lng: 38.81190 },

  // ── Library & Science block ───────────────────────────────────────────────
  { id: "library_jct",       name: "Library Junction",             lat: 8.88970, lng: 38.81090 },
  { id: "science_jct",       name: "Science Block Junction",       lat: 8.89060, lng: 38.81250 },

  // ── ICT / Engineering block ───────────────────────────────────────────────
  { id: "ict_jct",           name: "ICT / Engineering Junction",   lat: 8.89100, lng: 38.80980 },
  { id: "research_jct",      name: "Research Directorate Rd",      lat: 8.89170, lng: 38.80820 },

  // ── East road (runs N-S on east side) ─────────────────────────────────────
  { id: "east_road_s",       name: "East Road South",              lat: 8.88750, lng: 38.81380 },
  { id: "east_road_n",       name: "East Road North",              lat: 8.88950, lng: 38.81450 },

  // ── Cafeteria / Sports area ───────────────────────────────────────────────
  { id: "cafeteria_jct",     name: "Cafeteria Junction",           lat: 8.88540, lng: 38.80450 },
  { id: "sports_jct",        name: "Sports Complex Junction",      lat: 8.88360, lng: 38.80470 },

  // ── Northern area ─────────────────────────────────────────────────────────
  { id: "north_road_w",      name: "North Road West",              lat: 8.89180, lng: 38.80590 },
  { id: "north_road_e",      name: "North Road East",              lat: 8.89230, lng: 38.81050 },
];

/**
 * Undirected edges between road nodes — only connect nodes that share an
 * actual road or footpath on the campus.
 */
export const AASTU_ROAD_EDGES: [string, string][] = [
  // Entrance → west spine
  ["main_gate",     "gate_road_n"],
  ["gate_road_n",   "gate_road_n2"],
  ["gate_road_n2",  "west_spine_s"],

  // West spine N-S
  ["west_spine_s",  "west_spine_c"],
  ["west_spine_c",  "west_spine_n"],

  // West spine → admin / cafeteria
  ["west_spine_s",  "cafeteria_jct"],
  ["west_spine_s",  "sports_jct"],
  ["west_spine_c",  "admin_sw"],
  ["west_spine_n",  "admin_nw"],

  // Admin loop
  ["admin_sw",      "admin_se"],
  ["admin_se",      "admin_ne"],
  ["admin_ne",      "admin_nw"],
  ["admin_nw",      "admin_sw"],

  // Cafeteria / sports linkage
  ["cafeteria_jct", "admin_sw"],
  ["sports_jct",    "cafeteria_jct"],

  // Admin → central walkway
  ["admin_ne",      "central_w"],
  ["admin_nw",      "north_road_w"],

  // Central walkway E-W
  ["central_w",     "central_c"],
  ["central_c",     "central_e"],
  ["central_c",     "library_jct"],
  ["central_e",     "east_road_s"],

  // Library & science
  ["library_jct",   "science_jct"],
  ["library_jct",   "ict_jct"],
  ["science_jct",   "east_road_n"],

  // ICT / Research
  ["ict_jct",       "research_jct"],
  ["research_jct",  "north_road_e"],
  ["ict_jct",       "north_road_e"],

  // Northern road E-W
  ["north_road_w",  "north_road_e"],
  ["north_road_w",  "research_jct"],

  // East road N-S
  ["east_road_s",   "east_road_n"],
  ["east_road_n",   "science_jct"],
];

// ─── Priority Queue (Binary Min-Heap) ─────────────────────────────────────────

class PriorityQueue<T> {
  private heap: Array<{ item: T; priority: number }> = [];

  get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0].item;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = (index - 1) >> 1;
      if (this.heap[index].priority >= this.heap[parentIdx].priority) break;
      this.swap(index, parentIdx);
      index = parentIdx;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    const elementPriority = this.heap[index].priority;

    while (true) {
      const leftChildIdx = (index << 1) + 1;
      const rightChildIdx = leftChildIdx + 1;
      let swapIdx: number | null = null;
      let minPriority = elementPriority;

      if (leftChildIdx < length) {
        const leftPriority = this.heap[leftChildIdx].priority;
        if (leftPriority < minPriority) {
          minPriority = leftPriority;
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        const rightPriority = this.heap[rightChildIdx].priority;
        if (rightPriority < minPriority) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === null) break;
      this.swap(index, swapIdx);
      index = swapIdx;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

// ─── Utility functions ────────────────────────────────────────────────────────

function distanceSq(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dlat = lat1 - lat2;
  const dlng = (lng1 - lng2) * Math.cos((lat1 * Math.PI) / 180); // aspect-ratio correction
  return dlat * dlat + dlng * dlng;
}

function euclideanDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt(distanceSq(lat1, lng1, lat2, lng2));
}

/** Returns the nearest road node to the given coordinate. */
export function findNearestRoadNode(lat: number, lng: number): RoadNode {
  let closest = AASTU_ROAD_NODES[0];
  let minDist = Infinity;
  for (const node of AASTU_ROAD_NODES) {
    const dist = distanceSq(lat, lng, node.lat, node.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = node;
    }
  }
  return closest;
}

/**
 * Calculates the shortest walking path along campus roads using the A* Search Algorithm
 * with an admissible Euclidean heuristic and Binary Min-Heap Priority Queue.
 * Time Complexity: O((V + E) log V)
 *
 * Returns an ordered array of [lat, lng] tuples suitable for polylines and turn-by-turn routing.
 */
export function getCampusRoadPath(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): [number, number][] {
  const startNode = findNearestRoadNode(startLat, startLng);
  const destNode  = findNearestRoadNode(destLat,  destLng);

  // Build adjacency map with Euclidean weights
  const nodesById = new Map(AASTU_ROAD_NODES.map((n) => [n.id, n]));
  const adj = new Map<string, Array<{ id: string; weight: number }>>();
  for (const node of AASTU_ROAD_NODES) adj.set(node.id, []);

  for (const [u, v] of AASTU_ROAD_EDGES) {
    const nu = nodesById.get(u)!;
    const nv = nodesById.get(v)!;
    const w = euclideanDistance(nu.lat, nu.lng, nv.lat, nv.lng);
    adj.get(u)!.push({ id: v, weight: w });
    adj.get(v)!.push({ id: u, weight: w });
  }

  // A* Pathfinding
  const pq = new PriorityQueue<string>();
  const gScore = new Map<string, number>();
  const parent = new Map<string, string>();
  const closedSet = new Set<string>();

  for (const node of AASTU_ROAD_NODES) gScore.set(node.id, Infinity);
  gScore.set(startNode.id, 0);

  const initialH = euclideanDistance(startNode.lat, startNode.lng, destNode.lat, destNode.lng);
  pq.push(startNode.id, initialH);

  while (!pq.isEmpty) {
    const currentId = pq.pop()!;
    if (currentId === destNode.id) break;

    if (closedSet.has(currentId)) continue;
    closedSet.add(currentId);

    const currentG = gScore.get(currentId) ?? Infinity;

    for (const neighbor of adj.get(currentId) ?? []) {
      if (closedSet.has(neighbor.id)) continue;

      const tentativeG = currentG + neighbor.weight;
      if (tentativeG < (gScore.get(neighbor.id) ?? Infinity)) {
        parent.set(neighbor.id, currentId);
        gScore.set(neighbor.id, tentativeG);

        const neighborNode = nodesById.get(neighbor.id)!;
        const h = euclideanDistance(neighborNode.lat, neighborNode.lng, destNode.lat, destNode.lng);
        const f = tentativeG + h;

        pq.push(neighbor.id, f);
      }
    }
  }

  // Reconstruct path
  const pathNodeIds: string[] = [];
  let curr: string | undefined = destNode.id;
  while (curr) {
    pathNodeIds.push(curr);
    if (curr === startNode.id) break;
    curr = parent.get(curr);
  }
  pathNodeIds.reverse();

  // Build coordinate list: actual user position → road nodes → destination
  const coords: [number, number][] = [[startLat, startLng]];
  for (const id of pathNodeIds) {
    const n = nodesById.get(id);
    if (n) coords.push([n.lat, n.lng]);
  }
  coords.push([destLat, destLng]);

  return coords;
}
