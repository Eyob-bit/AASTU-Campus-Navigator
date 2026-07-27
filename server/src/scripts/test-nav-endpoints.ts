import { prisma } from "../config/prisma.js";

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;
const OFFICE_ID = "cmrkdjw320004s78k4vg74ikz";
const FLOOR_ID = "cmrkdif040002s78k2id17q4t";
const NONEXISTENT_CUID = "cmxxxxxxxxxxxxxxxxxxxxxx";

type ApiResponse = {
    success?: boolean;
    message?: string;
    data?: {
        building?: unknown;
        floor?: unknown;
        office?: unknown;
        entryScene?: { key?: string };
        destinationScene?: { key?: string };
        path?: Array<{ key?: string; imagePath?: string; displayOrder?: number }>;
    };
};

async function request(path: string): Promise<{ status: number; body: ApiResponse }> {
    const res = await fetch(`${BASE_URL}${path}`);
    const body = (await res.json()) as ApiResponse;
    return { status: res.status, body };
}

function pass(label: string) {
    console.log(`✅ PASS — ${label}`);
}

function fail(label: string, detail: string): never {
    throw new Error(`❌ FAIL — ${label}: ${detail}`);
}

async function testHappyPath() {
    console.log("\n--- Step 3: Happy Path (200) ---");
    const { status, body } = await request(`/navigation/${OFFICE_ID}`);

    if (status !== 200) fail("Happy path status", `expected 200, got ${status}`);
    if (!body.success) fail("Happy path success", JSON.stringify(body));
    if (body.message !== "Navigation path generated successfully.") {
        fail("Happy path message", body.message ?? "missing");
    }

    const { building, floor, office, entryScene, destinationScene, path } = body.data ?? {};
    if (!building) fail("Happy path", "building missing");
    if (!floor) fail("Happy path", "floor missing");
    if (!office) fail("Happy path", "office missing");
    if (!entryScene) fail("Happy path", "entryScene missing");
    if (!destinationScene) fail("Happy path", "destinationScene missing");
    if (!Array.isArray(path) || path.length === 0) fail("Happy path", "path empty or missing");

    const first = path![0];
    const last = path![path!.length - 1];
    if (first.key !== entryScene.key) {
        fail("Path order", `first step should be entry (${entryScene.key}), got ${first.key}`);
    }
    if (last.key !== destinationScene.key) {
        fail("Path order", `last step should be destination (${destinationScene.key}), got ${last.key}`);
    }
    if (!first.imagePath || first.displayOrder === undefined) {
        fail("Path node fields", "missing imagePath or displayOrder");
    }

    console.log(`   Path: ${path!.map((p) => p.key).join(" -> ")}`);
    pass("Valid office returns 200 with full navigation payload and correct path order");
}

async function testInvalidOfficeIdFormat() {
    console.log("\n--- Step 4: Invalid Office ID Format (400) ---");
    const { status, body } = await request("/navigation/abc");

    if (status !== 400) fail("Invalid CUID status", `expected 400, got ${status}`);
    if (body.success !== false) fail("Invalid CUID success flag", JSON.stringify(body));
    if (body.message !== "Invalid office id.") fail("Invalid CUID message", body.message ?? "missing");

    pass("Invalid CUID returns 400 from validator");
}

async function testOfficeNotFound() {
    console.log("\n--- Step 5: Office Not Found (404) ---");
    const { status, body } = await request(`/navigation/${NONEXISTENT_CUID}`);

    if (status !== 404) fail("Office not found status", `expected 404, got ${status}`);
    if (body.message !== "Office not found") fail("Office not found message", body.message ?? "missing");

    pass("Nonexistent office returns 404 from service");
}

async function testEntrySceneMissing() {
    console.log("\n--- Step 6: Entry Scene Missing (404) ---");
    const entryScene = await prisma.panoramaScene.findFirst({
        where: { floorId: FLOOR_ID, isEntryScene: true },
    });
    if (!entryScene) fail("Setup", "entry scene not found in database");

    await prisma.panoramaScene.update({
        where: { id: entryScene.id },
        data: { isEntryScene: false },
    });

    try {
        const { status, body } = await request(`/navigation/${OFFICE_ID}`);
        if (status !== 404) fail("Entry scene missing status", `expected 404, got ${status}`);
        if (body.message !== "Entry scene not configured") {
            fail("Entry scene missing message", body.message ?? "missing");
        }
        pass("Missing entry scene returns 404");
    } finally {
        await prisma.panoramaScene.update({
            where: { id: entryScene.id },
            data: { isEntryScene: true },
        });
    }
}

async function testDestinationSceneMissing() {
    console.log("\n--- Step 7: Destination Scene Missing (404) ---");
    const officeLabels = await prisma.sceneElement.findMany({
        where: { type: "OFFICE_LABEL", officeId: OFFICE_ID },
    });
    if (officeLabels.length === 0) fail("Setup", "OFFICE_LABEL not found for test office");

    await prisma.sceneElement.deleteMany({
        where: { type: "OFFICE_LABEL", officeId: OFFICE_ID },
    });

    try {
        const { status, body } = await request(`/navigation/${OFFICE_ID}`);
        if (status !== 404) fail("Destination missing status", `expected 404, got ${status}`);
        if (body.message !== "Destination scene not configured") {
            fail("Destination missing message", body.message ?? "missing");
        }
        pass("Missing destination scene returns 404");
    } finally {
        for (const label of officeLabels) {
            await prisma.sceneElement.create({
                data: {
                    type: "OFFICE_LABEL",
                    x: label.x,
                    y: label.y,
                    rotation: label.rotation,
                    label: label.label,
                    displayOrder: label.displayOrder,
                    isVisible: label.isVisible,
                    sceneId: label.sceneId,
                    officeId: OFFICE_ID,
                },
            });
        }
    }
}

async function testNoPathExists() {
    console.log("\n--- Step 8: No Path Exists (404) ---");
    const entryScene = await prisma.panoramaScene.findFirst({
        where: { floorId: FLOOR_ID, isEntryScene: true },
    });
    const officeLabels = await prisma.sceneElement.findMany({
        where: { type: "OFFICE_LABEL", officeId: OFFICE_ID },
    });
    if (!entryScene || officeLabels.length === 0) {
        fail("Setup", "entry scene or destination label not found");
    }

    await prisma.panoramaScene.deleteMany({
        where: { floorId: FLOOR_ID, key: "nav-test-disconnected" },
    });

    const disconnectedScene = await prisma.panoramaScene.create({
        data: {
            key: "nav-test-disconnected",
            name: "Nav Test Disconnected",
            imagePath: "/uploads/panoramas/disconnected.jpg",
            floorId: FLOOR_ID,
            displayOrder: 999,
        },
    });

    await prisma.sceneElement.deleteMany({
        where: { type: "OFFICE_LABEL", officeId: OFFICE_ID },
    });

    await prisma.sceneElement.create({
        data: {
            type: "OFFICE_LABEL",
            x: 0.3,
            y: 0.4,
            displayOrder: 1,
            sceneId: disconnectedScene.id,
            officeId: OFFICE_ID,
        },
    });

    try {
        const { status, body } = await request(`/navigation/${OFFICE_ID}`);
        if (status !== 404) fail("No path status", `expected 404, got ${status}`);
        if (body.message !== "Navigation path could not be generated") {
            fail("No path message", body.message ?? "missing");
        }
        pass("Unreachable destination returns 404");
    } finally {
        await prisma.sceneElement.deleteMany({
            where: { type: "OFFICE_LABEL", officeId: OFFICE_ID },
        });

        for (const label of officeLabels) {
            await prisma.sceneElement.create({
                data: {
                    type: "OFFICE_LABEL",
                    x: label.x,
                    y: label.y,
                    rotation: label.rotation,
                    label: label.label,
                    displayOrder: label.displayOrder,
                    isVisible: label.isVisible,
                    sceneId: label.sceneId,
                    officeId: OFFICE_ID,
                },
            });
        }

        await prisma.panoramaScene.delete({ where: { id: disconnectedScene.id } }).catch(() => {});
    }
}

async function testInactiveOffice() {
    console.log("\n--- Step 9: Inactive Office (404) ---");
    const office = await prisma.office.findUnique({ where: { id: OFFICE_ID } });
    if (!office) fail("Setup", "test office not found");

    await prisma.office.update({
        where: { id: OFFICE_ID },
        data: { isActive: false },
    });

    try {
        const { status, body } = await request(`/navigation/${OFFICE_ID}`);
        if (status !== 404) fail("Inactive office status", `expected 404, got ${status}`);
        if (body.message !== "Office not found") fail("Inactive office message", body.message ?? "missing");
        pass("Inactive office returns 404");
    } finally {
        await prisma.office.update({
            where: { id: OFFICE_ID },
            data: { isActive: true },
        });
    }
}

async function runNavigationApiTests() {
    console.log("Navigation API Integration Tests");
    console.log(`Target: ${BASE_URL}/navigation/:officeId`);

    try {
        await fetch(`${BASE_URL}/`);
    } catch {
        fail("Server", `Cannot reach ${BASE_URL}. Run npm run dev first.`);
    }

    try {
        await testHappyPath();
        await testInvalidOfficeIdFormat();
        await testOfficeNotFound();
        await testEntrySceneMissing();
        await testDestinationSceneMissing();
        await testNoPathExists();
        await testInactiveOffice();

        console.log("\n=== ALL NAVIGATION API TESTS PASSED — Sprint 6 complete ===");
    } catch (err) {
        console.error("\n", err instanceof Error ? err.message : err);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

runNavigationApiTests();
