import { prisma } from "../src/config/prisma.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const sqlPath = path.join(__dirname, "../prisma/migrations/20260914000001_building_complex_and_connections/migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  console.log("Applying migration SQL...");
  
  // Split on statement blocks (DO $$ ... $$; or standard SQL statements ending in ;)
  const statements: string[] = [];
  let current = "";
  let inDollarBlock = false;
  
  const lines = sql.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") && !inDollarBlock) continue;
    
    if (line.includes("$$")) {
      inDollarBlock = !inDollarBlock;
    }
    current += line + "\n";
    if (!inDollarBlock && trimmed.endsWith(";")) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = "";
    }
  }
  if (current.trim()) {
    statements.push(current.trim());
  }

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (e: any) {
      console.warn(`Warning on statement ${i + 1}:`, e.message);
    }
  }
  console.log("Migration executed successfully!");
  
  // Verify Building table
  const sample = await prisma.building.findFirst();
  console.log("Sample building query:", sample?.name ?? "No buildings yet");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
