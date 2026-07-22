import app from "../app.js";
import { prisma } from "../config/prisma.js";
import fs from "fs";
import path from "path";

async function runTests() {
    console.log("Starting test server...");
    const server = app.listen(5002);
    const baseUrl = "http://localhost:5002/api";

    // We will use a known floor ID from test-db query
    const floorId = "cmrkdif040002s78k2id17q4t";
    let createdSceneId = "";
    let firstFilename = "";
    let secondFilename = "";

    try {
        console.log("\n--- TEST CASE 1: POST scene without image ---");
        const fd1 = new FormData();
        fd1.append("name", "Test Scene 1");
        fd1.append("key", "test-scene-1");
        fd1.append("displayOrder", "10");
        fd1.append("isEntryScene", "false");

        const res1 = await fetch(`${baseUrl}/floors/${floorId}/scenes`, {
            method: "POST",
            body: fd1,
        });
        const data1 = await res1.json() as any;
        console.log("Status:", res1.status);
        console.log("Response:", data1);
        if (res1.status !== 400 || !data1.message.includes("panorama image")) {
            throw new Error("Test Case 1 failed");
        }

        console.log("\n--- TEST CASE 2: POST scene with wrong extension (GIF) ---");
        const fd2 = new FormData();
        fd2.append("image", new Blob([Buffer.from("gif-data")], { type: "image/gif" }), "test.gif");
        fd2.append("name", "Test Scene 2");
        fd2.append("key", "test-scene-2");

        const res2 = await fetch(`${baseUrl}/floors/${floorId}/scenes`, {
            method: "POST",
            body: fd2,
        });
        const data2 = await res2.json() as any;
        console.log("Status:", res2.status);
        console.log("Response:", data2);
        if (res2.status !== 400 || !data2.message.includes("allowed")) {
            throw new Error("Test Case 2 failed");
        }

        console.log("\n--- TEST CASE 3: POST scene with too large file (>20MB) ---");
        const largeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21 MB
        const fd3 = new FormData();
        fd3.append("image", new Blob([largeBuffer], { type: "image/jpeg" }), "large.jpg");
        fd3.append("name", "Test Scene 3");
        fd3.append("key", "test-scene-3");

        const res3 = await fetch(`${baseUrl}/floors/${floorId}/scenes`, {
            method: "POST",
            body: fd3,
        });
        const data3 = await res3.json() as any;
        console.log("Status:", res3.status);
        console.log("Response:", data3);
        if (res3.status !== 400 || !data3.message.includes("20 MB")) {
            throw new Error("Test Case 3 failed");
        }

        console.log("\n--- TEST CASE 4: POST scene with valid image (Success) ---");
        const fd4 = new FormData();
        fd4.append("image", new Blob([Buffer.from("fake-jpeg-content")], { type: "image/jpeg" }), "hall.jpg");
        fd4.append("name", "Test Hall");
        fd4.append("key", "test-hall");
        fd4.append("displayOrder", "20");
        fd4.append("isEntryScene", "false");

        const res4 = await fetch(`${baseUrl}/floors/${floorId}/scenes`, {
            method: "POST",
            body: fd4,
        });
        const data4 = await res4.json() as any;
        console.log("Status:", res4.status);
        console.log("Response:", data4);
        if (res4.status !== 201 || !data4.success) {
            throw new Error("Test Case 4 failed");
        }
        createdSceneId = data4.data.id;
        firstFilename = data4.data.imageFilename;
        console.log("Created Scene ID:", createdSceneId);
        console.log("Uploaded Filename:", firstFilename);

        // Verify physical file exists
        const filePath = path.join("uploads", "panoramas", firstFilename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File ${filePath} does not exist on disk!`);
        }
        console.log(`Verified: File exists at ${filePath}`);

        console.log("\n--- TEST CASE 5: POST scene with duplicate key (Rollback test) ---");
        const fd5 = new FormData();
        fd5.append("image", new Blob([Buffer.from("another-fake-jpeg-content")], { type: "image/jpeg" }), "hall2.jpg");
        fd5.append("name", "Unique Name but Duplicate Key");
        fd5.append("key", "test-hall"); // Duplicate key!

        const res5 = await fetch(`${baseUrl}/floors/${floorId}/scenes`, {
            method: "POST",
            body: fd5,
        });
        const data5 = await res5.json() as any;
        console.log("Status:", res5.status);
        console.log("Response:", data5);
        if (res5.status !== 400 || !data5.message.includes("unique")) {
            throw new Error("Test Case 5 failed");
        }
        // Verify that the file uploaded during this failed request was deleted
        const files = fs.readdirSync("uploads/panoramas");
        const hall2Files = files.filter(f => f.includes("hall2"));
        if (hall2Files.length > 0) {
            throw new Error("File hall2 was not rolled back (deleted) on database error!");
        }
        console.log("Verified: Uploaded file was rolled back successfully.");

        console.log("\n--- TEST CASE 6: PATCH scene with new valid image (Replacement test) ---");
        const fd6 = new FormData();
        fd6.append("image", new Blob([Buffer.from("new-fake-jpeg-content")], { type: "image/jpeg" }), "hall-updated.jpg");
        fd6.append("name", "Test Hall Updated");

        const res6 = await fetch(`${baseUrl}/scenes/${createdSceneId}`, {
            method: "PATCH",
            body: fd6,
        });
        const data6 = await res6.json() as any;
        console.log("Status:", res6.status);
        console.log("Response:", data6);
        if (res6.status !== 200 || !data6.success) {
            throw new Error("Test Case 6 failed");
        }
        secondFilename = data6.data.imageFilename;
        console.log("Updated Filename:", secondFilename);

        // Verify old file is deleted and new file exists
        const oldFilePath = path.join("uploads", "panoramas", firstFilename);
        const newFilePath = path.join("uploads", "panoramas", secondFilename);
        if (fs.existsSync(oldFilePath)) {
            throw new Error(`Old file ${oldFilePath} was not deleted!`);
        }
        if (!fs.existsSync(newFilePath)) {
            throw new Error(`New file ${newFilePath} does not exist!`);
        }
        console.log("Verified: Old file was deleted and new file was saved.");

        console.log("\n--- TEST CASE 7: DELETE scene (Cleanup test) ---");
        const res7 = await fetch(`${baseUrl}/scenes/${createdSceneId}`, {
            method: "DELETE",
        });
        const data7 = await res7.json() as any;
        console.log("Status:", res7.status);
        console.log("Response:", data7);
        if (res7.status !== 200 || !data7.success) {
            throw new Error("Test Case 7 failed");
        }

        // Verify physical file is deleted
        if (fs.existsSync(newFilePath)) {
            throw new Error(`File ${newFilePath} was not deleted after scene deletion!`);
        }
        console.log("Verified: Physical file was deleted after scene deletion.");

        // Clear tracking since we deleted it
        createdSceneId = "";

        console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        console.log("Stopping test server...");
        server.close();
        if (createdSceneId) {
            await prisma.panoramaScene.delete({ where: { id: createdSceneId } }).catch(() => {});
        }
        await prisma.$disconnect();
    }
}

runTests();
