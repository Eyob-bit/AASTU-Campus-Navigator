import { LandmarkService } from "../server/src/services/landmark.service.js";

async function main() {
  const service = new LandmarkService();
  try {
    const result = await service.createLandmark({
      name: "Test Landmark",
      category: "FOOD",
      latitude: 8.885,
      longitude: 38.805,
    });
    console.log("SUCCESS:", result);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();
