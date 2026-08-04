/**
 * Seed script: populate InfoChannel, InfoContact, InfoLink with the original
 * hardcoded data from InformationPage.tsx so the public page shows content
 * immediately after migration.
 *
 * Run: npx ts-node --esm src/scripts/seedInfoContent.ts
 *   or: npx tsx src/scripts/seedInfoContent.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding InfoContent tables…");

  // ── Channels ──────────────────────────────────────────────────────────────
  const channels = [
    { label: "Main AASTU Channel",   url: "https://t.me/aastu_official",    platform: "telegram", colorClass: "text-sky-400 bg-sky-500/10",  sortOrder: 0 },
    { label: "Official Page",        url: "https://facebook.com/aastu",      platform: "facebook", colorClass: "text-blue-400 bg-blue-500/10", sortOrder: 1 },
    { label: "AASTU Campus Life",    url: "https://tiktok.com/@aastu",       platform: "tiktok",   colorClass: "text-pink-400 bg-pink-500/10", sortOrder: 2 },
    { label: "Academic Lectures",    url: "https://youtube.com/@aastu",      platform: "youtube",  colorClass: "text-red-400 bg-red-500/10",   sortOrder: 3 },
    { label: "Student Union & Clubs",url: "https://t.me/aastu_su",          platform: "telegram", colorClass: "text-sky-400 bg-sky-500/10",  sortOrder: 4 },
    { label: "Engineering Faculty",  url: "https://t.me/aastu_engineering",  platform: "telegram", colorClass: "text-sky-400 bg-sky-500/10",  sortOrder: 5 },
    { label: "Science Faculty",      url: "https://t.me/aastu_science",      platform: "telegram", colorClass: "text-sky-400 bg-sky-500/10",  sortOrder: 6 },
    { label: "Computing Faculty",    url: "https://t.me/aastu_computing",    platform: "telegram", colorClass: "text-sky-400 bg-sky-500/10",  sortOrder: 7 },
  ];

  for (const ch of channels) {
    const exists = await prisma.infoChannel.findFirst({ where: { label: ch.label } });
    if (!exists) {
      await prisma.infoChannel.create({ data: { ...ch, isActive: true } });
      console.log(`  ✓ Channel: ${ch.label}`);
    } else {
      console.log(`  – Skipped (exists): ${ch.label}`);
    }
  }

  // ── Contacts ──────────────────────────────────────────────────────────────
  const contacts = [
    { type: "phone", label: "Main Reception", value: "+251 11 888 0000", sortOrder: 0 },
    { type: "email", label: "Admissions",      value: "admissions@aastu.edu.et", sortOrder: 1 },
  ];

  for (const co of contacts) {
    const exists = await prisma.infoContact.findFirst({ where: { label: co.label } });
    if (!exists) {
      await prisma.infoContact.create({ data: { ...co, isActive: true } });
      console.log(`  ✓ Contact: ${co.label}`);
    } else {
      console.log(`  – Skipped (exists): ${co.label}`);
    }
  }

  // ── Links ─────────────────────────────────────────────────────────────────
  const links = [
    { label: "Library Catalog",        url: "/search?q=library",    iconName: "BookOpen", sortOrder: 0 },
    { label: "E-learning Portal",      url: "/search?q=elearning",  iconName: "Laptop",   sortOrder: 1 },
    { label: "Campus Map & Directory", url: "/",                    iconName: "Map",      sortOrder: 2 },
    { label: "Academic Calendar",      url: "/search?q=calendar",   iconName: "Calendar", sortOrder: 3 },
  ];

  for (const lk of links) {
    const exists = await prisma.infoLink.findFirst({ where: { label: lk.label } });
    if (!exists) {
      await prisma.infoLink.create({ data: { ...lk, isActive: true } });
      console.log(`  ✓ Link: ${lk.label}`);
    } else {
      console.log(`  – Skipped (exists): ${lk.label}`);
    }
  }

  console.log("\n✅ Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
