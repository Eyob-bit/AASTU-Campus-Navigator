import { PrismaClient, RoadNodeType, LandmarkCategory, SceneElementType } from "@prisma/client";
import { calculateHaversineDistance } from "../src/utils/haversine.js";

const prisma = new PrismaClient();

// ── Complete AASTU Campus Walkway & Road Network Nodes ─────────────────────────
const AASTU_ROAD_NODES = [
  // Entrance & Main Gate area
  { id: "main_gate",         name: "Main Campus Gate",             lat: 8.88218, lng: 38.79665, type: RoadNodeType.GATE, zone: "North Gate Zone" },
  { id: "gate_road_n",       name: "Gate Road North",              lat: 8.88310, lng: 38.79813, type: RoadNodeType.WALKWAY, zone: "North Gate Zone" },
  { id: "gate_road_n2",      name: "Gate Road North 2",            lat: 8.88400, lng: 38.79960, type: RoadNodeType.WALKWAY, zone: "North Gate Zone" },

  // West spine road
  { id: "west_spine_s",      name: "West Spine Road South",        lat: 8.88480, lng: 38.80100, type: RoadNodeType.INTERSECTION, zone: "West Zone" },
  { id: "west_spine_c",      name: "West Spine Road Centre",       lat: 8.88620, lng: 38.80230, type: RoadNodeType.INTERSECTION, zone: "West Zone" },
  { id: "west_spine_n",      name: "West Spine Road North",        lat: 8.88800, lng: 38.80320, type: RoadNodeType.INTERSECTION, zone: "West Zone" },

  // Central loop / Admin area
  { id: "admin_sw",          name: "Admin SW Junction",            lat: 8.88710, lng: 38.80560, type: RoadNodeType.INTERSECTION, zone: "Central Campus" },
  { id: "admin_se",          name: "Admin SE Junction",            lat: 8.88640, lng: 38.80720, type: RoadNodeType.INTERSECTION, zone: "Central Campus" },
  { id: "admin_ne",          name: "Admin NE Junction",            lat: 8.88820, lng: 38.80790, type: RoadNodeType.BUILDING_ENTRANCE, zone: "Central Campus" },
  { id: "admin_nw",          name: "Admin NW Junction",            lat: 8.88900, lng: 38.80620, type: RoadNodeType.INTERSECTION, zone: "Central Campus" },

  // Central walkway
  { id: "central_w",         name: "Central Walkway West",         lat: 8.88880, lng: 38.80890, type: RoadNodeType.WALKWAY, zone: "Academic Zone" },
  { id: "central_c",         name: "Central Walkway Centre",       lat: 8.88870, lng: 38.81020, type: RoadNodeType.WALKWAY, zone: "Academic Zone" },
  { id: "central_e",         name: "Central Walkway East",         lat: 8.88860, lng: 38.81190, type: RoadNodeType.WALKWAY, zone: "Academic Zone" },

  // Library & Science block
  { id: "library_jct",       name: "Library Junction",             lat: 8.88970, lng: 38.81090, type: RoadNodeType.BUILDING_ENTRANCE, zone: "Academic Zone" },
  { id: "science_jct",       name: "Science Block Junction",       lat: 8.89060, lng: 38.81250, type: RoadNodeType.BUILDING_ENTRANCE, zone: "Academic Zone" },

  // ICT / Engineering block
  { id: "ict_jct",           name: "ICT / Engineering Junction",   lat: 8.89100, lng: 38.80980, type: RoadNodeType.BUILDING_ENTRANCE, zone: "Innovation Hub" },
  { id: "research_jct",      name: "Research Directorate Rd",      lat: 8.89170, lng: 38.80820, type: RoadNodeType.INTERSECTION, zone: "Innovation Hub" },

  // East road
  { id: "east_road_s",       name: "East Road South",              lat: 8.88750, lng: 38.81380, type: RoadNodeType.WALKWAY, zone: "East Zone" },
  { id: "east_road_n",       name: "East Road North",              lat: 8.88950, lng: 38.81450, type: RoadNodeType.WALKWAY, zone: "East Zone" },

  // Cafeteria / Sports area
  { id: "cafeteria_jct",     name: "Cafeteria Junction",           lat: 8.88540, lng: 38.80450, type: RoadNodeType.BUILDING_ENTRANCE, zone: "Student Services" },
  { id: "sports_jct",        name: "Sports Complex Junction",      lat: 8.88360, lng: 38.80470, type: RoadNodeType.BUILDING_ENTRANCE, zone: "Sports Zone" },

  // Northern area
  { id: "north_road_w",      name: "North Road West",              lat: 8.89180, lng: 38.80590, type: RoadNodeType.WALKWAY, zone: "North Zone" },
  { id: "north_road_e",      name: "North Road East",              lat: 8.89230, lng: 38.81050, type: RoadNodeType.WALKWAY, zone: "North Zone" },
];

// ── Complete Road Edge Connections ──────────────────────────────────────────
const AASTU_ROAD_EDGES: [string, string][] = [
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

async function main() {
  console.log("🌱 Populating Complete AASTU Campus Road Network into Neon DB...");

  // ── 0. Clean Existing Data ──────────────────────────────────────────────────
  console.log("🧹 Clearing old records...");
  await prisma.sceneElement.deleteMany();
  await prisma.panoramaScene.deleteMany();
  await prisma.searchAlias.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.office.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.landmark.deleteMany();
  await prisma.building.deleteMany();
  await prisma.roadEdge.deleteMany();
  await prisma.roadNode.deleteMany();

  // ── 1. Populate All 23 Real Road Nodes ──────────────────────────────────────
  console.log("📍 Creating 23 Real Road Nodes from campus graph...");
  const createdNodesMap = new Map<string, string>(); // customId -> DB cuid

  for (const n of AASTU_ROAD_NODES) {
    const created = await prisma.roadNode.create({
      data: {
        name: n.name,
        type: n.type,
        zone: n.zone,
        latitude: n.lat,
        longitude: n.lng,
      },
    });
    createdNodesMap.set(n.id, created.id);
  }

  // ── 2. Populate All 30 Real Road Edges ──────────────────────────────────────
  console.log("🛣️ Creating 30 Real Road Edges with Haversine distances...");
  const nodeCoordsMap = new Map(AASTU_ROAD_NODES.map((n) => [n.id, n]));

  for (const [fromId, toId] of AASTU_ROAD_EDGES) {
    const fromNode = nodeCoordsMap.get(fromId);
    const toNode = nodeCoordsMap.get(toId);
    const dbFromId = createdNodesMap.get(fromId);
    const dbToId = createdNodesMap.get(toId);

    if (fromNode && toNode && dbFromId && dbToId) {
      const realDist = Math.round(
        calculateHaversineDistance(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng)
      );

      await prisma.roadEdge.create({
        data: {
          fromNodeId: dbFromId,
          toNodeId: dbToId,
          distance: Math.max(10, realDist),
          isBidirectional: true,
          isWalkable: true,
        },
      });
    }
  }

  // ── 3. Link Buildings to Nearest Nodes ─────────────────────────────────────
  console.log("🏢 Creating Campus Buildings connected to Road Graph...");
  const bAdmin = await prisma.building.create({
    data: {
      name: "Administration Building",
      code: "ADM-01",
      entranceLatitude: 8.8882,
      entranceLongitude: 38.8079,
      entranceRoadNodeId: createdNodesMap.get("admin_ne"),
      entranceImage: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=800&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
      themeColor: "#0284c7",
      zone: "Central Campus",
      isActive: true,
    },
  });

  const bLibrary = await prisma.building.create({
    data: {
      name: "AASTU Central Library",
      code: "LIB-01",
      entranceLatitude: 8.8897,
      entranceLongitude: 38.8109,
      entranceRoadNodeId: createdNodesMap.get("library_jct"),
      entranceImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1200&auto=format&fit=crop",
      themeColor: "#2563eb",
      zone: "Academic Zone",
      isActive: true,
    },
  });

  const bBlk76 = await prisma.building.create({
    data: {
      name: "Block 76 - Software Eng & CS",
      code: "BLK-76",
      entranceLatitude: 8.8897,
      entranceLongitude: 38.8109,
      entranceRoadNodeId: createdNodesMap.get("library_jct"),
      entranceImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop",
      themeColor: "#06b6d4",
      zone: "Engineering Complex",
      isActive: true,
    },
  });

  const bIct = await prisma.building.create({
    data: {
      name: "AASTU ICT & Incubation Center",
      code: "ICT-01",
      entranceLatitude: 8.8910,
      entranceLongitude: 38.8098,
      entranceRoadNodeId: createdNodesMap.get("ict_jct"),
      entranceImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
      themeColor: "#ec4899",
      zone: "Innovation Hub",
      isActive: true,
    },
  });

  const bCafeteria = await prisma.building.create({
    data: {
      name: "Student Cafeteria & Lounge",
      code: "CAF-01",
      entranceLatitude: 8.8854,
      entranceLongitude: 38.8045,
      entranceRoadNodeId: createdNodesMap.get("cafeteria_jct"),
      entranceImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
      themeColor: "#10b981",
      zone: "Student Services",
      isActive: true,
    },
  });

  // ── 4. Create Floors, Offices & Staff ──────────────────────────────────────
  console.log("🚪 Creating Floors, Offices & Staff...");
  const fBlk76Ground = await prisma.floor.create({
    data: { buildingId: bBlk76.id, floorNumber: 0 },
  });
  const fBlk76First = await prisma.floor.create({
    data: { buildingId: bBlk76.id, floorNumber: 1 },
  });

  const offSEHead = await prisma.office.create({
    data: {
      name: "Department of Software Engineering",
      roomNumber: "76-G01",
      description: "Department Head Office, Student Advising & Academic Consultation",
      floorId: fBlk76Ground.id,
      isActive: true,
    },
  });

  const offAILab = await prisma.office.create({
    data: {
      name: "AI & Data Science Research Lab",
      roomNumber: "76-G05",
      description: "Advanced AI, Computer Vision and Machine Learning Research Hub",
      floorId: fBlk76Ground.id,
      isActive: true,
    },
  });

  const offCSHead = await prisma.office.create({
    data: {
      name: "Department of Computer Science",
      roomNumber: "76-102",
      description: "CS Department Office & Staff Offices",
      floorId: fBlk76First.id,
      isActive: true,
    },
  });

  await prisma.staff.createMany({
    data: [
      {
        fullName: "Dr. Solomon Gebremichael",
        position: "Head, Dept. of Software Engineering",
        email: "solomon.g@aastu.edu.et",
        phone: "+251 91 123 4567",
        officeId: offSEHead.id,
        isActive: true,
      },
      {
        fullName: "Ato Dawit Kebede",
        position: "Lecturer & Senior Software Architect",
        email: "dawit.k@aastu.edu.et",
        phone: "+251 91 234 5678",
        officeId: offSEHead.id,
        isActive: true,
      },
      {
        fullName: "Dr. Tigist Mengistu",
        position: "Associate Professor & AI Lab Lead",
        email: "tigist.m@aastu.edu.et",
        phone: "+251 91 345 6789",
        officeId: offAILab.id,
        isActive: true,
      },
      {
        fullName: "Dr. Abera Bekele",
        position: "Head, Dept. of Computer Science",
        email: "abera.b@aastu.edu.et",
        phone: "+251 91 456 7890",
        officeId: offCSHead.id,
        isActive: true,
      },
    ],
  });

  // Admin Offices
  const fAdminGround = await prisma.floor.create({
    data: { buildingId: bAdmin.id, floorNumber: 0 },
  });

  const offRegistrar = await prisma.office.create({
    data: {
      name: "University Main Registrar Office",
      roomNumber: "ADM-G01",
      description: "Student Admissions & Transcripts Processing",
      floorId: fAdminGround.id,
      isActive: true,
    },
  });

  await prisma.staff.create({
    data: {
      fullName: "W/ro Martha Tadesse",
      position: "University Chief Registrar",
      email: "registrar@aastu.edu.et",
      phone: "+251 11 896 1234",
      officeId: offRegistrar.id,
      isActive: true,
    },
  });

  // ── 5. Create Campus Landmarks ─────────────────────────────────────────────
  console.log("📍 Creating Campus Landmarks...");
  await prisma.landmark.createMany({
    data: [
      {
        name: "AASTU Main Campus Gate",
        description: "Primary Entrance Gate along Akaki Road",
        category: LandmarkCategory.TRANSPORT,
        latitude: 8.88218,
        longitude: 38.79665,
        icon: "🚪",
        isVisible: true,
        roadNodeId: createdNodesMap.get("main_gate"),
      },
      {
        name: "AASTU Central Library",
        description: "3-story Digital & Print Library Complex",
        category: LandmarkCategory.EDUCATION,
        latitude: 8.8897,
        longitude: 38.8109,
        icon: "📚",
        isVisible: true,
        buildingId: bLibrary.id,
        roadNodeId: createdNodesMap.get("library_jct"),
      },
      {
        name: "Student Central Cafeteria",
        description: "Main Dining Hall & Student Lounge",
        category: LandmarkCategory.FOOD,
        latitude: 8.8854,
        longitude: 38.8045,
        icon: "☕",
        isVisible: true,
        buildingId: bCafeteria.id,
        roadNodeId: createdNodesMap.get("cafeteria_jct"),
      },
      {
        name: "AASTU ICT & Incubation Hub",
        description: "Incubation Center, Network Ops & Startup Labs",
        category: LandmarkCategory.SERVICES,
        latitude: 8.8910,
        longitude: 38.8098,
        icon: "💻",
        isVisible: true,
        buildingId: bIct.id,
        roadNodeId: createdNodesMap.get("ict_jct"),
      },
      {
        name: "Administration Building",
        description: "University Administration & Registrar Headquarters",
        category: LandmarkCategory.ADMINISTRATION,
        latitude: 8.8882,
        longitude: 38.8079,
        icon: "🏛️",
        isVisible: true,
        buildingId: bAdmin.id,
        roadNodeId: createdNodesMap.get("admin_ne"),
      },
    ],
  });

  // ── 6. Create 360° Panorama Scenes ─────────────────────────────────────────
  console.log("📷 Creating 360° Panorama Scenes...");
  const sEntrance = await prisma.panoramaScene.create({
    data: {
      key: "scene_blk76_entrance",
      name: "Block 76 Ground Floor Main Entrance",
      imagePath: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1600&auto=format&fit=crop",
      displayOrder: 1,
      isEntryScene: true,
      floorId: fBlk76Ground.id,
    },
  });

  const sSEDept = await prisma.panoramaScene.create({
    data: {
      key: "scene_blk76_se_dept",
      name: "Software Engineering Dept Hallway",
      imagePath: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
      displayOrder: 2,
      isEntryScene: false,
      floorId: fBlk76Ground.id,
    },
  });

  await prisma.sceneElement.create({
    data: {
      displayOrder: 1,
      type: SceneElementType.ARROW,
      label: "Walk to Software Engineering Offices",
      x: 0.5,
      y: 0.6,
      sceneId: sEntrance.id,
      nextSceneId: sSEDept.id,
    },
  });

  await prisma.sceneElement.create({
    data: {
      displayOrder: 1,
      type: SceneElementType.OFFICE_LABEL,
      label: "Room 76-G01: Software Engineering Dept Head",
      x: 0.35,
      y: 0.45,
      sceneId: sSEDept.id,
      officeId: offSEHead.id,
    },
  });

  console.log("✅ All 23 real road nodes, 30 edges, buildings, and offices seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
