import { BetStatus, Role } from "@prisma/client";
import { prisma } from "./client";

function calculatePointsAwarded(oddsLocked: number, isKingLock: boolean) {
  const basePoints = Math.max(0, oddsLocked);
  const multiplier = isKingLock ? 2 : 1;
  return Math.round(basePoints * multiplier);
}

// User Queries
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { bets: true }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  });
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username }
  });
}

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  inviteCodeUsed: string;
  role?: Role;
}) {
  return prisma.user.create({
    data
  });
}

// Leaderboard Query
export async function getLeaderboard() {
  return prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      username: true,
      totalPoints: true,
      betsWon: true,
      betsLost: true,
      biggestHit: true
    },
    orderBy: [{ totalPoints: "desc" }, { betsWon: "desc" }, { biggestHit: "desc" }]
  });
}

// Bet Queries
export async function getUserBetsForWeek(userId: string, weekNumber: number) {
  return prisma.bet.findMany({
    where: {
      userId,
      weekNumber
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createBet(data: {
  userId: string;
  weekNumber: number;
  sport: string;
  description: string;
  oddsAmerican: number;
  oddsLocked: number;
  isKingLock: boolean;
  gameStartTime: Date;
  isBonusBet?: boolean;
  bonusBetId?: string;
}) {
  return prisma.bet.create({
    data
  });
}

export async function updateBetStatus(
  betId: string,
  status: BetStatus
) {
  const bet = await prisma.bet.findUnique({
    where: { id: betId }
  });

  if (!bet) {
    throw new Error("Bet not found");
  }

  let pointsAwarded: number | null = bet.pointsAwarded ?? null;

  if (status === "WON") {
    pointsAwarded = calculatePointsAwarded(bet.oddsLocked, bet.isKingLock);
  } else if (status === "LOST") {
    pointsAwarded = 0;
  } else if (status === "VOIDED") {
    pointsAwarded = null;
  }

  return prisma.bet.update({
    where: { id: betId },
    data: {
      status,
      pointsAwarded,
      resolvedAt: new Date()
    }
  });
}

export async function deleteBet(betId: string) {
  return prisma.bet.delete({
    where: { id: betId }
  });
}

// Update user stats after bet resolution
export async function updateUserStats(userId: string) {
  const bets = await prisma.bet.findMany({
    where: { userId }
  });

  const totalPoints = bets
    .filter((b) => b.status === "WON")
    .reduce((sum, b) => sum + (b.pointsAwarded ?? 0), 0);

  const betsWon = bets.filter((b) => b.status === "WON").length;
  const betsLost = bets.filter((b) => b.status === "LOST").length;
  const biggestHit = Math.max(...bets.map((b) => b.pointsAwarded ?? 0), 0);

  return prisma.user.update({
    where: { id: userId },
    data: {
      totalPoints,
      betsWon,
      betsLost,
      biggestHit
    }
  });
}

// Invite Code Queries
export async function createInviteCode(code: string) {
  return prisma.inviteCode.create({
    data: { code }
  });
}

export async function validateInviteCode(code: string) {
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code }
  });

  return Boolean(inviteCode && inviteCode.isActive && !inviteCode.usedBy);
}

export async function markInviteCodeAsUsed(code: string, userId: string) {
  return prisma.inviteCode.update({
    where: { code },
    data: {
      usedBy: userId,
      usedAt: new Date(),
      isActive: false
    }
  });
}
