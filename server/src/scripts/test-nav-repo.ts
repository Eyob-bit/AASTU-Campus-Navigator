import { NavigationRepository } from "../repositories/navigation.repository.js";
import { prisma } from "../config/prisma.js";

async function testNavRepo() {
    const repo = new NavigationRepository();

    const officeId = "cmrkdjw320004s78k4vg74ikz";
    const floorId = "cmrkdif040002s78k2id17q4t";
    const sceneId = "cmrkdsg15000as78kp0ryb1i0";

    try {
        console.log("--- TESTING findOfficeById ---");
        const office = await repo.findOfficeById(officeId);
        console.log("Office Name:", office?.name);
        console.log("Office Floor Number:", (office as any)?.floor?.floorNumber);
        console.log("Office Building Name:", (office as any)?.floor?.building?.name);
        if (!office || !(office as any).floor?.building?.name) {
            throw new Error("findOfficeById returned unexpected structure");
        }

        console.log("\n--- TESTING findEntryScene ---");
        const entryScene = await repo.findEntryScene(floorId);
        console.log("Entry Scene Name:", entryScene?.name);
        console.log("Is Entry Scene:", entryScene?.isEntryScene);
        if (!entryScene || !entryScene.isEntryScene) {
            throw new Error("findEntryScene failed");
        }

        console.log("\n--- TESTING findDestinationScene ---");
        const destScene = await repo.findDestinationScene(officeId);
        console.log("Destination Scene Name:", destScene?.name);
        console.log("Destination Scene Key:", destScene?.key);
        if (!destScene) {
            throw new Error("findDestinationScene failed");
        }

        console.log("\n--- TESTING findSceneGraph ---");
        const scenes = await repo.findSceneGraph(floorId);
        console.log("Scenes count on floor:", scenes.length);
        scenes.forEach((scene) => {
            console.log(`Scene: ${scene.name} (${scene.key})`);
            console.log(`  Elements count: ${(scene as any).elements?.length}`);
            (scene as any).elements?.forEach((element: any) => {
                console.log(`    Element Type: ${element.type}`);
                console.log(`    Target Scene Key: ${element.nextScene?.key}`);
            });
        });
        if (scenes.length === 0) {
            throw new Error("findSceneGraph returned empty array");
        }

        console.log("\n--- TESTING findSceneById ---");
        const scene = await repo.findSceneById(sceneId);
        console.log("Scene Name:", scene?.name);
        if (!scene || scene.id !== sceneId) {
            throw new Error("findSceneById failed");
        }

        console.log("\n=== ALL NAVIGATION REPOSITORY TESTS PASSED ===");
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

testNavRepo();
