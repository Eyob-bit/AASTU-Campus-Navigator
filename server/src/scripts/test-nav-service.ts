import { NavigationService } from "../services/navigation.service.js";
import { prisma } from "../config/prisma.js";

async function runNavServiceTests() {
    const service = new NavigationService();

    const officeId = "cmrkdjw320004s78k4vg74ikz"; // Head Office
    const floorId = "cmrkdif040002s78k2id17q4t";

    let seededArrowId = "";
    let disconnectedSceneId = "";

    try {
        console.log("Setting up navigation graph test data...");

        // 1. Fetch Main Hall and Room Corridor scenes
        const mainHall = await prisma.panoramaScene.findFirst({
            where: { floorId, isEntryScene: true }
        });
        const roomCorridor = await prisma.panoramaScene.findFirst({
            where: { floorId, key: "room-corridor" }
        });

        if (!mainHall || !roomCorridor) {
            throw new Error("Could not find test scenes");
        }

        // 2. Seed navigation arrow main-hall -> room-corridor
        const arrow = await prisma.sceneElement.create({
            data: {
                type: "ARROW",
                x: 10,
                y: 20,
                sceneId: mainHall.id,
                nextSceneId: roomCorridor.id,
                displayOrder: 99, // Avoid constraints
            }
        });
        seededArrowId = arrow.id;

        console.log("Arrow seeded. Starting service test cases...\n");

        // --- TEST CASE 1: Successful Path Generation ---
        console.log("--- TEST CASE 1: Successful Path Generation ---");
        const result = await service.navigate(officeId);
        console.log("Building Name:", result.building?.name);
        console.log("Floor Number:", result.floor?.floorNumber);
        console.log("Office Room Number:", result.office?.roomNumber);
        console.log("Entry Scene Key:", result.entryScene?.key);
        console.log("Destination Scene Key:", result.destinationScene?.key);
        console.log("Calculated Path Length:", result.path?.length);
        console.log("Calculated Path:", result.path.map(p => p.name).join(" -> "));

        if (result.path.length !== 2 || result.path[0].id !== mainHall.id || result.path[1].id !== roomCorridor.id) {
            throw new Error("Test Case 1 failed: Calculated path is incorrect");
        }

        if (!result.path[0].imagePath || result.path[0].displayOrder === undefined) {
            throw new Error("Test Case 1 failed: Path nodes missing imagePath/displayOrder");
        }

        // --- TEST CASE 2: Office Not Found ---
        console.log("\n--- TEST CASE 2: Office Not Found Exception ---");
        try {
            await service.navigate("invalid-office-id");
            throw new Error("Test Case 2 failed: Expected office not found error");
        } catch (err: any) {
            console.log("Status Code:", err.statusCode);
            console.log("Message:", err.message);
            if (err.statusCode !== 404 || !err.message.includes("not found")) {
                throw new Error("Test Case 2 failed: Incorrect error envelope");
            }
        }

        // --- TEST CASE 3: No Path Available ---
        console.log("\n--- TEST CASE 3: No Path Exception ---");
        // Create a third disconnected scene on the floor
        const disconnectedScene = await prisma.panoramaScene.create({
            data: {
                key: "disconnected-scene",
                name: "Disconnected Scene",
                imagePath: "/uploads/panoramas/disconnected.jpg",
                floorId,
                displayOrder: 100, // Avoid constraints
            }
        });
        disconnectedSceneId = disconnectedScene.id;

        // Swap office label to disconnected scene to force "No Path"
        await prisma.sceneElement.updateMany({
            where: { type: "OFFICE_LABEL", officeId },
            data: { sceneId: disconnectedScene.id }
        });

        try {
            await service.navigate(officeId);
            throw new Error("Test Case 3 failed: Expected path generation exception");
        } catch (err: any) {
            console.log("Status Code:", err.statusCode);
            console.log("Message:", err.message);
            if (err.statusCode !== 404 || !err.message.includes("could not be generated")) {
                throw new Error("Test Case 3 failed: Incorrect error envelope");
            }
        }

        // Restore office label
        await prisma.sceneElement.updateMany({
            where: { type: "OFFICE_LABEL", officeId },
            data: { sceneId: roomCorridor.id }
        });

        console.log("\n=== ALL NAVIGATION SERVICE TESTS PASSED ===");
    } catch (err) {
        console.error("Test execution failed:", err);
    } finally {
        console.log("\nCleaning up seeded navigation test data...");
        if (seededArrowId) {
            await prisma.sceneElement.delete({ where: { id: seededArrowId } }).catch(() => {});
        }
        if (disconnectedSceneId) {
            await prisma.panoramaScene.delete({ where: { id: disconnectedSceneId } }).catch(() => {});
        }
        await prisma.$disconnect();
    }
}

runNavServiceTests();
