/**
 * One-time password reset script. Delete after use.
 * Usage: npx tsx scripts/reset-password.ts
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL = 'gangadeentim@gmail.com'; // ← your admin email
const NEW_PASSWORD = 'ChangeMe123!';     // ← set this to whatever you want

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (!user) {
    console.error(`No user found with email: ${EMAIL}`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(NEW_PASSWORD, 12);

  await prisma.user.update({
    where: { email: EMAIL },
    data: { password: hashed },
  });

  console.log(`✓ Password reset for ${user.username} (${EMAIL})`);
  console.log(`  New password: ${NEW_PASSWORD}`);
  console.log(`\n  Log in, then delete scripts/reset-password.ts`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
