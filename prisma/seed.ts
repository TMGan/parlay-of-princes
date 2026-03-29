import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@parlayofprinces.com" },
    update: {},
    create: {
      email: "admin@parlayofprinces.com",
      username: "admin",
      password: adminPassword,
      role: "ADMIN",
      inviteCodeUsed: "ADMIN_INVITE"
    }
  });
  console.log("✅ Admin user created:", admin.username);

  // Create test users
  const testPassword = await bcrypt.hash("test123", 10);
  const users = [];

  for (let i = 1; i <= 5; i += 1) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@test.com` },
      update: {},
      create: {
        email: `user${i}@test.com`,
        username: `TestUser${i}`,
        password: testPassword,
        role: "USER",
        inviteCodeUsed: `TEST${i}`,
        totalPoints: Math.floor(Math.random() * 5000),
        betsWon: Math.floor(Math.random() * 20),
        betsLost: Math.floor(Math.random() * 15),
        biggestHit: Math.floor(Math.random() * 800) + 200
      }
    });
    users.push(user);
    console.log(`✅ Test user created: ${user.username}`);
  }

  // Create invite codes
  const inviteCodes = ["PARLAY2024", "PRINCE123", "BETA001", "BETA002", "BETA003"];
  for (const code of inviteCodes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: { code }
    });
    console.log(`✅ Invite code created: ${code}`);
  }

  // Create default league
  const currentYear = new Date().getFullYear();
  const defaultLeague = await prisma.league.upsert({
    where: { joinCode: "MAIN2024" },
    update: {},
    create: {
      name: `${currentYear} Season`,
      creatorId: admin.id,
      joinCode: "MAIN2024",
      isPublic: true
    }
  });
  console.log(`✅ League created: ${defaultLeague.name}`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
