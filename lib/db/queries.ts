import { BetStatus, Role } from "@prisma/client";
import { prisma } from "./client";
import { updateLeagueMemberStats } from "./league-queries";

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
export async function getAllUserBets(userId: string) {
  return prisma.bet.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserBetsForWeek(userId: string, weekNumber: number, leagueId?: string) {
  return prisma.bet.findMany({
    where: {
      userId,
      weekNumber,
      ...(leagueId ? { leagueId } : {}),
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createBet(data: {
  userId: string;
  leagueId?: string;
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
  return prisma.bet.create({ data });
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

// Update user stats after bet resolution or point adjustment.
// totalPoints = sum of won bet points + all manual adjustments (never overwrite adjustments).
export async function updateUserStats(userId: string) {
  const [bets, adjustments] = await Promise.all([
    prisma.bet.findMany({ where: { userId } }),
    prisma.pointAdjustment.findMany({ where: { userId } }),
  ]);

  const betPoints = bets
    .filter((b) => b.status === "WON")
    .reduce((sum, b) => sum + (b.pointsAwarded ?? 0), 0);
  const adjustmentPoints = adjustments.reduce((sum, a) => sum + a.amount, 0);

  const totalPoints = betPoints + adjustmentPoints;
  const betsWon = bets.filter((b) => b.status === "WON").length;
  const betsLost = bets.filter((b) => b.status === "LOST").length;
  // biggestHit tracks the largest single winning bet — adjustments are excluded intentionally
  const biggestHit = Math.max(0, ...bets.map((b) => b.pointsAwarded ?? 0));

  return prisma.user.update({
    where: { id: userId },
    data: { totalPoints, betsWon, betsLost, biggestHit },
  });
}

// Public profile query — no email, no password, no pending bets
export async function getPublicProfile(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      role: true,
      totalPoints: true,
      betsWon: true,
      betsLost: true,
      biggestHit: true,
      createdAt: true,
      bets: {
        where: { status: { not: 'PENDING' } },
        orderBy: { resolvedAt: 'desc' },
        select: {
          id: true,
          sport: true,
          description: true,
          oddsLocked: true,
          isKingLock: true,
          isBonusBet: true,
          status: true,
          pointsAwarded: true,
          weekNumber: true,
          resolvedAt: true,
        },
      },
      leagueMemberships: {
        where: { status: 'ACTIVE' },
        include: {
          league: { select: { id: true, name: true } },
        },
      },
    },
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

// Get all users for dropdown
export async function getAllUsersForAdmin() {
  return await prisma.user.findMany({
    where: {
      role: "USER" // Only show regular users, not admins
    },
    select: {
      id: true,
      username: true,
      email: true
    },
    orderBy: {
      username: "asc"
    }
  });
}

// Get all users with their stats
export async function getAllUsersWithStats() {
  const users = await prisma.user.findMany({
    include: {
      bets: {
        select: {
          status: true
        }
      }
    },
    orderBy: {
      totalPoints: "desc"
    }
  });

  return users.map((user) => {
    const betsWon = user.bets.filter((bet) => bet.status === "WON").length;
    const betsLost = user.bets.filter((bet) => bet.status === "LOST").length;
    const totalBets = betsWon + betsLost;
    const winRate = totalBets > 0 ? Math.round((betsWon / totalBets) * 100) : 0;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      totalPoints: user.totalPoints,
      betsWon,
      betsLost,
      winRate,
      createdAt: user.createdAt
    };
  });
}

// Get single user with full details
export async function getUserWithDetails(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bets: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

// Adjust user points for a specific league.
// Creates the adjustment record then recalculates stats so the total is always
// derived from the full history — manual adjustments are never lost on the next resolution.
export async function adjustUserPoints(
  userId: string,
  amount: number,
  reason: string,
  adjustedBy: string,
  leagueId: string
) {
  await prisma.pointAdjustment.create({
    data: { userId, adjustedBy, amount, reason, leagueId },
  });

  // Recalculate both global and league-specific stats in parallel
  await Promise.all([
    updateUserStats(userId),
    updateLeagueMemberStats(userId, leagueId),
  ]);
}

// Change user role
export async function changeUserRole(userId: string, newRole: "USER" | "ADMIN") {
  return await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });
}

// Re-export league queries and types
export * from './league-queries';
export type * from '@/lib/types/league';

// Re-export chat queries and types
export * from './chat-queries';
export type * from '@/lib/types/chat';
