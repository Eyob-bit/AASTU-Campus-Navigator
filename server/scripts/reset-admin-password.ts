import { prisma } from "../src/config/prisma.js";
import bcrypt from "bcryptjs";

const NEW_PASSWORD = "admin123";
const hashed = await bcrypt.hash(NEW_PASSWORD, 12);

const profile = await prisma.adminProfile.findFirst();
if (profile) {
  await prisma.adminProfile.update({
    where: { id: profile.id },
    data: { passwordHash: hashed },
  });
  console.log(`✅ Password reset to: "${NEW_PASSWORD}"`);
  console.log(`   Email: ${profile.email}`);
} else {
  await prisma.adminProfile.create({
    data: {
      fullName: "Admin User",
      email: "admin@aastu.edu.et",
      role: "Super Admin",
      passwordHash: hashed,
    },
  });
  console.log(`✅ Admin profile created with password: "${NEW_PASSWORD}"`);
  console.log(`   Email: admin@aastu.edu.et`);
}

await prisma.$disconnect();
