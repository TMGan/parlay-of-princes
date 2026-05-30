import { prisma } from './client';

export type ParsedBonusBet = {
  id: string;
  name: string;
  description: string;
  sport: string;
  availableDate: Date;
  expiryDate: Date;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getActiveBonusBet(): Promise<ParsedBonusBet | null> {
  const now = new Date();
  return prisma.bonusBet.findFirst({
    where: {
      availableDate: { lte: now },
      expiryDate: { gte: now },
    },
    orderBy: { availableDate: 'desc' },
  });
}

/** Returns all bonus picks whose window is currently open (may be more than one). */
export async function getActiveBonusBets(): Promise<ParsedBonusBet[]> {
  const now = new Date();
  return prisma.bonusBet.findMany({
    where: {
      availableDate: { lte: now },
      expiryDate: { gte: now },
    },
    orderBy: { availableDate: 'desc' },
  });
}

/**
 * Returns the user's claim for a specific bonus bet window, or null if not yet claimed.
 *
 * The claim is scoped to the bonus bet's current `availableDate` — this prevents a claim
 * from a previous window (when an admin edits the same bonus bet record with a new date
 * rather than creating a fresh one) from blocking the new window.
 */
export async function getUserClaimForBonusBet(userId: string, bonusBetId: string) {
  const bonusBet = await prisma.bonusBet.findUnique({
    where: { id: bonusBetId },
    select: { availableDate: true },
  });
  if (!bonusBet) return null;

  return prisma.bet.findFirst({
    where: {
      userId,
      isBonusBet: true,
      bonusBetId,
      // Only count claims placed on or after this window opened
      createdAt: { gte: bonusBet.availableDate },
    },
  });
}

export async function getAllBonusBets(): Promise<ParsedBonusBet[]> {
  return prisma.bonusBet.findMany({
    orderBy: { availableDate: 'desc' },
  });
}

export async function createBonusBet(data: {
  name: string;
  description: string;
  sport: string;
  availableDate: Date;
  expiryDate: Date;
  createdByUserId: string;
}) {
  return prisma.bonusBet.create({ data });
}

export async function updateBonusBet(
  id: string,
  data: {
    name: string;
    description: string;
    sport: string;
    availableDate: Date;
    expiryDate: Date;
  }
) {
  return prisma.bonusBet.update({ where: { id }, data });
}

export async function deleteBonusBet(id: string) {
  return prisma.bonusBet.delete({ where: { id } });
}

export async function getUserBonusBetForWeek(userId: string, weekNumber: number) {
  return prisma.bet.findFirst({
    where: { userId, weekNumber, isBonusBet: true },
  });
}
