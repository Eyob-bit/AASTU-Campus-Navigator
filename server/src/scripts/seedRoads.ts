import { prisma } from "../config/prisma.js";
import { calculateHaversineDistance } from "../utils/haversine.js";

const DEFAULT_NODES = [
  { key: "main_gate", name: "Main Campus Gate", latitude: 8.88218, longitude: 38.79665 },
  { key: "gate_road_n", name: "Gate Road North", latitude: 8.88310, longitude: 38.79813 },
  { key: "gate_road_n2", name: "Gate Road North 2", latitude: 8.88400, longitude: 38.79960 },
  { key: "west_spine_s", name: "West Spine Road South", latitude: 8.88480, longitude: 38.80100 },
  { key: "west_spine_c", name: "West Spine Road Centre", latitude: 8.88620, longitude: 38.80230 },
  { key: "west_spine_n", name: "West Spine Road North", latitude: 8.88800, longitude: 38.80320 },
  { key: "admin_sw", name: "Admin SW Junction", latitude: 8.88710, longitude: 38.80560 },
  { key: "admin_se", name: "Admin SE Junction", latitude: 8.88640, longitude: 38.80720 },
  { key: "admin_ne", name: "Admin NE Junction", latitude: 8.88820, longitude: 38.80790 },
  { key: "admin_nw", name: "Admin NW Junction", latitude: 8.88900, longitude: 38.80620 },
  { key: "central_w", name: "Central Walkway West", latitude: 8.88880, longitude: 38.80890 },
  { key: "central_c", name: "Central Walkway Centre", latitude: 8.88870, longitude: 38.81020 },
  { key: "central_e", name: "Central Walkway East", latitude: 8.88860, longitude: 38.81190 },
  { key: "library_jct", name: "Library Junction", latitude: 8.88970, longitude: 38.81090 },
  { key: "science_jct", name: "Science Block Junction", latitude: 8.89060, longitude: 38.81250 },
  { key: "ict_jct", name: "ICT / Engineering Junction", latitude: 8.89100, longitude: 38.80980 },
  { key: "research_jct", name: "Research Directorate Rd", latitude: 8.89170, longitude: 38.80820 },
  { key: "east_road_s", name: "East Road South", latitude: 8.88750, longitude: 38.81380 },
  { key: "east_road_n", name: "East Road North", latitude: 8.88950, longitude: 38.81450 },
  { key: "cafeteria_jct", name: "Cafeteria Junction", latitude: 8.88540, longitude: 38.80450 },
  { key: "sports_jct", name: "Sports Complex Junction", latitude: 8.88360, longitude: 38.80470 },
  { key: "north_road_w", name: "North Road West", latitude: 8.89180, longitude: 38.80590 },
  { key: "north_road_e", name: "North Road East", latitude: 8.89230, longitude: 38.81050 },
];

const DEFAULT_EDGES: [string, string][] = [
  ["main_gate", "gate_road_n"],
  ["gate_road_n", "gate_road_n2"],
  ["gate_road_n2", "west_spine_s"],
  ["west_spine_s", "west_spine_c"],
  ["west_spine_c", "west_spine_n"],
  ["west_spine_s", "cafeteria_jct"],
  ["west_spine_s", "sports_jct"],
  ["west_spine_c", "admin_sw"],
  ["west_spine_n", "admin_nw"],
  ["admin_sw", "admin_se"],
  ["admin_se", "admin_ne"],
  ["admin_ne", "admin_nw"],
  ["admin_nw", "admin_sw"],
  ["cafeteria_jct", "admin_sw"],
  ["sports_jct", "cafeteria_jct"],
  ["admin_ne", "central_w"],
  ["admin_nw", "north_road_w"],
  ["central_w", "central_c"],
  ["central_c", "central_e"],
  ["central_c", "library_jct"],
  ["central_e", "east_road_s"],
  ["library_jct", "science_jct"],
  ["library_jct", "ict_jct"],
  ["science_jct", "east_road_n"],
  ["ict_jct", "research_jct"],
  ["research_jct", "north_road_e"],
  ["ict_jct", "north_road_e"],
  ["north_road_w", "north_road_e"],
  ["north_road_w", "research_jct"],
  ["east_road_s", "east_road_n"],
  ["east_road_n", "science_jct"],
];

async function main() {
  console.log("Seeding Road Nodes and Edges into database...");

  const existingCount = await prisma.roadNode.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} road nodes. Skipping seed.`);
    return;
  }

  const createdNodeMap = new Map<string, string>(); // key -> DB id

  for (const node of DEFAULT_NODES) {
    const created = await prisma.roadNode.create({
      data: {
        name: node.name,
        latitude: node.latitude,
        longitude: node.longitude,
      },
    });
    createdNodeMap.set(node.key, created.id);
  }

  console.log(`Created ${createdNodeMap.size} road nodes.`);

  let edgeCount = 0;
  for (const [uKey, vKey] of DEFAULT_EDGES) {
    const fromId = createdNodeMap.get(uKey);
    const toId = createdNodeMap.get(vKey);
    const uNode = DEFAULT_NODES.find((n) => n.key === uKey);
    const vNode = DEFAULT_NODES.find((n) => n.key === vKey);

    if (fromId && toId && uNode && vNode) {
      const dist = calculateHaversineDistance(
        uNode.latitude,
        uNode.longitude,
        vNode.latitude,
        vNode.longitude
      );

      await prisma.roadEdge.create({
        data: {
          fromNodeId: fromId,
          toNodeId: toId,
          distance: Math.round(dist * 100) / 100,
          isBidirectional: true,
        },
      });
      edgeCount++;
    }
  }

  console.log(`Created ${edgeCount} road edges.`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
