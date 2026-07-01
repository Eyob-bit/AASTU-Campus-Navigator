import { prisma } from "../config/prisma";

async function main() {
  const buildings = await prisma.building.findMany();

  console.log(buildings);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });