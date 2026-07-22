import { prisma } from "../config/prisma.js";

async function check() {
  const buildings = await prisma.building.findMany({
    include: {
      floors: {
        include: {
          scenes: true
        }
      }
    }
  });

  console.log("Database Snapshot:");
  for (const b of buildings) {
    console.log(`Building: ${b.name} (${b.id})`);
    for (const f of b.floors) {
      console.log(`  Floor ${f.floorNumber} (${f.id}): ${f.scenes.length} scenes`);
      for (const s of f.scenes) {
        console.log(`    - Scene: ${s.name} (${s.id}) [imagePath: ${s.imagePath}]`);
      }
    }
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
