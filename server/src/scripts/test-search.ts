import app from "../app.js";
import { prisma } from "../config/prisma.js";

async function runSearchTests() {
    console.log("Starting test server...");
    const server = app.listen(5003);
    const baseUrl = "http://localhost:5003/api/search";

    const officeId = "cmrkdjw320004s78k4vg74ikz";
    const floorId = "cmrkdif040002s78k2id17q4t";

    let testStaffId = "";
    let testOfficeAliasId = "";
    let testStaffAliasId = "";
    let inactiveStaffId = "";
    let inactiveOfficeId = "";
    let extraOfficeId = "";

    try {
        console.log("Seeding test data...");

        // 1. Seed active staff
        const testStaff = await prisma.staff.create({
            data: {
                fullName: "Abebe Kebede",
                position: "Dean",
                officeId,
                isActive: true,
            },
        });
        testStaffId = testStaff.id;

        // 2. Seed active search alias pointing to office
        const testOfficeAlias = await prisma.searchAlias.create({
            data: {
                alias: "Research Bureau",
                normalizedAlias: "research bureau",
                officeId,
            },
        });
        testOfficeAliasId = testOfficeAlias.id;

        // 3. Seed active search alias pointing to staff
        const testStaffAlias = await prisma.searchAlias.create({
            data: {
                alias: "Dean Room",
                normalizedAlias: "dean room",
                staffId: testStaff.id,
            },
        });
        testStaffAliasId = testStaffAlias.id;

        // 4. Seed inactive staff
        const inactiveStaff = await prisma.staff.create({
            data: {
                fullName: "Inactive Abebe",
                position: "Inactive Position",
                officeId,
                isActive: false,
            },
        });
        inactiveStaffId = inactiveStaff.id;

        // 5. Seed inactive office
        const inactiveOffice = await prisma.office.create({
            data: {
                name: "Inactive Office Dept",
                roomNumber: "999",
                floorId,
                isActive: false,
            },
        });
        inactiveOfficeId = inactiveOffice.id;

        // 6. Seed extra office to verify multiple results and ranking
        const extraOffice = await prisma.office.create({
            data: {
                name: "Registrar Office",
                roomNumber: "103",
                floorId,
                isActive: true,
            },
        });
        extraOfficeId = extraOffice.id;

        console.log("Seed complete. Starting search test cases...\n");

        // --- TEST CASES ---

        console.log("--- TEST CASE 1: Search by Office Name (Partial & Case Insensitive) ---");
        const res1 = await fetch(`${baseUrl}?q=head`);
        const data1 = await res1.json() as any;
        console.log("Status:", res1.status);
        console.log("Is Array:", Array.isArray(data1.data));
        console.log("Results Count:", data1.data?.length);
        console.log("First Result Type:", data1.data?.[0]?.type);
        console.log("First Office Name:", data1.data?.[0]?.office?.name);
        console.log("Destination Scene Key:", data1.data?.[0]?.destinationScene?.key);
        if (res1.status !== 200 || !Array.isArray(data1.data) || data1.data[0]?.type !== "office" || data1.data[0]?.office?.name !== "Head Office") {
            throw new Error("Test Case 1 failed");
        }
        if (data1.data[0]?.destinationScene?.key !== "room-corridor") {
            throw new Error("Test Case 1: Destination scene mapping failed");
        }
        if (data1.data[0]?.office?.createdAt || data1.data[0]?.building?.updatedAt) {
            throw new Error("Test Case 1: Database timestamp internals exposed!");
        }

        console.log("\n--- TEST CASE 2: Search by Office Room Number ---");
        const res2 = await fetch(`${baseUrl}?q=102`);
        const data2 = await res2.json() as any;
        console.log("Status:", res2.status);
        console.log("Results Count:", data2.data?.length);
        console.log("Office Name:", data2.data?.[0]?.office?.name);
        if (res2.status !== 200 || !Array.isArray(data2.data) || data2.data[0]?.office?.roomNumber !== "102") {
            throw new Error("Test Case 2 failed");
        }

        console.log("\n--- TEST CASE 3: Search by Staff Full Name ---");
        const res3 = await fetch(`${baseUrl}?q=Abebe`);
        const data3 = await res3.json() as any;
        console.log("Status:", res3.status);
        console.log("Results Count:", data3.data?.length);
        console.log("First Result Type:", data3.data?.[0]?.type);
        console.log("Staff Name:", data3.data?.[0]?.staff?.fullName);
        if (res3.status !== 200 || !Array.isArray(data3.data) || data3.data[0]?.type !== "staff" || data3.data[0]?.staff?.fullName !== "Abebe Kebede") {
            throw new Error("Test Case 3 failed");
        }

        console.log("\n--- TEST CASE 4: Search by Staff Position ---");
        const res4 = await fetch(`${baseUrl}?q=dean`);
        const data4 = await res4.json() as any;
        console.log("Status:", res4.status);
        console.log("Results Count:", data4.data?.length);
        console.log("Staff Name:", data4.data?.[0]?.staff?.fullName);
        if (res4.status !== 200 || !Array.isArray(data4.data) || data4.data[0]?.staff?.position !== "Dean") {
            throw new Error("Test Case 4 failed");
        }

        console.log("\n--- TEST CASE 5: Search by Office Search Alias ---");
        const res5 = await fetch(`${baseUrl}?q=Research%20Bureau`);
        const data5 = await res5.json() as any;
        console.log("Status:", res5.status);
        console.log("Results Count:", data5.data?.length);
        console.log("First Office Name:", data5.data?.[0]?.office?.name);
        if (res5.status !== 200 || !Array.isArray(data5.data) || data5.data[0]?.office?.name !== "Head Office") {
            throw new Error("Test Case 5 failed");
        }

        console.log("\n--- TEST CASE 6: Search by Staff Search Alias ---");
        const res6 = await fetch(`${baseUrl}?q=Dean%20Room`);
        const data6 = await res6.json() as any;
        console.log("Status:", res6.status);
        console.log("Results Count:", data6.data?.length);
        console.log("Staff Name:", data6.data?.[0]?.staff?.fullName);
        if (res6.status !== 200 || !Array.isArray(data6.data) || data6.data[0]?.staff?.fullName !== "Abebe Kebede") {
            throw new Error("Test Case 6 failed");
        }

        console.log("\n--- TEST CASE 7: Validation - Empty query parameter ---");
        const res7 = await fetch(`${baseUrl}?q=`);
        const data7 = await res7.json() as any;
        console.log("Status:", res7.status);
        console.log("Message:", data7.message);
        if (res7.status !== 400 || !data7.message) {
            throw new Error("Test Case 7 failed");
        }

        console.log("\n--- TEST CASE 8: Validation - Too short query ---");
        const res8 = await fetch(`${baseUrl}?q=a`);
        const data8 = await res8.json() as any;
        console.log("Status:", res8.status);
        console.log("Message:", data8.message);
        if (res8.status !== 400 || !data8.message.includes("at least 2")) {
            throw new Error("Test Case 8 failed");
        }

        console.log("\n--- TEST CASE 9: Search Not Found ---");
        const res9 = await fetch(`${baseUrl}?q=Batman`);
        const data9 = await res9.json() as any;
        console.log("Status:", res9.status);
        console.log("Message:", data9.message);
        if (res9.status !== 404 || !data9.message.includes("found")) {
            throw new Error("Test Case 9 failed");
        }

        console.log("\n--- TEST CASE 10: Inactive Staff Exclusion ---");
        const res10 = await fetch(`${baseUrl}?q=Inactive%20Abebe`);
        const data10 = await res10.json() as any;
        console.log("Status:", res10.status);
        console.log("Message:", data10.message);
        if (res10.status !== 404) {
            throw new Error("Test Case 10 failed: Inactive staff returned!");
        }

        console.log("\n--- TEST CASE 11: Inactive Office Exclusion ---");
        const res11 = await fetch(`${baseUrl}?q=Inactive%20Office`);
        const data11 = await res11.json() as any;
        console.log("Status:", res11.status);
        console.log("Message:", data11.message);
        if (res11.status !== 404) {
            throw new Error("Test Case 11 failed: Inactive office returned!");
        }

        console.log("\n--- TEST CASE 12: Search Ranking (Exact -> StartsWith -> Contains) ---");
        // We search 'Registrar Office' or 'Registrar' which matches 'Registrar Office'
        // If we query 'Registrar', the exact match should be returned first.
        const res12 = await fetch(`${baseUrl}?q=Registrar`);
        const data12 = await res12.json() as any;
        console.log("Status:", res12.status);
        console.log("Results Count:", data12.data?.length);
        console.log("First Result Name:", data12.data?.[0]?.office?.name);
        if (res12.status !== 200 || data12.data?.[0]?.office?.name !== "Registrar Office") {
            throw new Error("Test Case 12 failed");
        }

        console.log("\n--- TEST CASE 13: Collapse Spaces in Normalization ---");
        const res13 = await fetch(`${baseUrl}?q=Head%20%20%20%20Office`);
        const data13 = await res13.json() as any;
        console.log("Status:", res13.status);
        console.log("Office Name:", data13.data?.[0]?.office?.name);
        if (res13.status !== 200 || data13.data?.[0]?.office?.name !== "Head Office") {
            throw new Error("Test Case 13 failed");
        }

        console.log("\n=== ALL SEARCH INTEGRATION TESTS PASSED ===");
    } catch (err) {
        console.error("Test execution failed:", err);
    } finally {
        console.log("\nCleaning up seeded test data...");
        if (testStaffAliasId) {
            await prisma.searchAlias.delete({ where: { id: testStaffAliasId } }).catch(() => {});
        }
        if (testOfficeAliasId) {
            await prisma.searchAlias.delete({ where: { id: testOfficeAliasId } }).catch(() => {});
        }
        if (testStaffId) {
            await prisma.staff.delete({ where: { id: testStaffId } }).catch(() => {});
        }
        if (inactiveStaffId) {
            await prisma.staff.delete({ where: { id: inactiveStaffId } }).catch(() => {});
        }
        if (inactiveOfficeId) {
            await prisma.office.delete({ where: { id: inactiveOfficeId } }).catch(() => {});
        }
        if (extraOfficeId) {
            await prisma.office.delete({ where: { id: extraOfficeId } }).catch(() => {});
        }

        console.log("Stopping test server...");
        server.close();
        await prisma.$disconnect();
    }
}

runSearchTests();
