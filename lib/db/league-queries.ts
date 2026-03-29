import { prisma } from '@/lib/db/client';
import type { League, LeaderboardEntry } from '@/lib/types/league';

const SAFE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars: 0/O, 1/I
const JOIN_CODE_LENGTH = 6;
const MAX_CODE_GENERATION_ATTEMPTS = 10;

/**
 * Generate a unique 6-character join code.
 * @throws Error if unable to generate a unique code after MAX_CODE_GENERATION_ATTEMPTS
 */
export async function generateUniqueJoinCode(): Promise<string> {
  for (let attempts = 0; attempts < MAX_CODE_GENERATION_ATTEMPTS; attempts++) {
    let code = '';
    for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
      code += SAFE_CHARACTERS.charAt(Math.floor(Math.random() * SAFE_CHARACTERS.length));
    }

    const existing = await prisma.league.findUnique({ where: { joinCode: code } });
    if (!existing) return code;
  }

  throw new Error(
    `Failed to generate unique join code after ${MAX_CODE_GENERATION_ATTEMPTS} attempts`
  );
}

/**
 * Create a new league.
 * Creator is automatically added as an ADMIN member in a transaction.
 */
export async function createLeague(data: {
  name: string;
  description?: string | null;
  creatorId: string;
  isPublic?: boolean;
  minMembers?: number;
  maxMembers?: number;
}): Promise<League> {
  const joinCode = await generateUniqueJoinCode();

  return prisma.$transaction(async (tx) => {
    const league = await tx.league.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        creatorId: data.creatorId,
        joinCode,
        isPublic: data.isPublic ?? false,
        minMembers: data.minMembers ?? 3,
        maxMembers: data.maxMembers ?? 20,
      },
    });

    await tx.leagueMember.create({
      data: {
        leagueId: league.id,
        userId: data.creatorId,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    return league;
  });
}

/**
 * Get league by ID with full member and creator details.
 */
export async function getLeagueWithMembers(leagueId: string) {
  return prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      creator: {
        select: { id: true, username: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, username: true, email: true, totalPoints: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });
}

/**
 * Get league by join code.
 */
export async function getLeagueByJoinCode(joinCode: string) {
  return prisma.league.findUnique({
    where: { joinCode: joinCode.toUpperCase() },
    include: {
      creator: { select: { id: true, username: true } },
      members: { select: { userId: true, status: true } },
    },
  });
}

/**
 * Get all active leagues a user belongs to.
 */
export async function getUserLeagues(userId: string) {
  return prisma.leagueMember.findMany({
    where: { userId, status: 'ACTIVE' },
    include: {
      league: {
        include: {
          creator: { select: { id: true, username: true } },
          _count: {
            select: { members: { where: { status: 'ACTIVE' } } },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}

/**
 * Request to join a league.
 * - Public leagues: instant ACTIVE status.
 * - Private leagues: PENDING until approved.
 * @throws Error if already a member, request pending, or league is full.
 */
export async function requestJoinLeague(leagueId: string, userId: string): Promise<void> {
  const existing = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });

  if (existing?.status === 'ACTIVE') throw new Error('Already a member of this league');
  if (existing?.status === 'PENDING') throw new Error('Join request already pending');

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      _count: { select: { members: { where: { status: 'ACTIVE' } } } },
    },
  });

  if (!league) throw new Error('League not found');
  if (league._count.members >= league.maxMembers) throw new Error('League is full');

  const status = league.isPublic ? 'ACTIVE' : 'PENDING';

  if (existing) {
    await prisma.leagueMember.update({
      where: { id: existing.id },
      data: { status },
    });
  } else {
    await prisma.leagueMember.create({
      data: { leagueId, userId, role: 'MEMBER', status },
    });
  }
}

/**
 * Approve a pending join request.
 */
export async function approveJoinRequest(leagueId: string, userId: string): Promise<void> {
  await prisma.leagueMember.updateMany({
    where: { leagueId, userId, status: 'PENDING' },
    data: { status: 'ACTIVE' },
  });
}

/**
 * Remove a member from a league (soft delete).
 */
export async function removeMemberFromLeague(leagueId: string, userId: string): Promise<void> {
  await prisma.leagueMember.updateMany({
    where: { leagueId, userId },
    data: { status: 'REMOVED' },
  });
}

/**
 * Check if a user is an active admin of a league.
 */
export async function isLeagueAdmin(leagueId: string, userId: string): Promise<boolean> {
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });
  return member?.role === 'ADMIN' && member?.status === 'ACTIVE';
}

/**
 * Check if a user is an active member of a league.
 */
export async function isLeagueMember(leagueId: string, userId: string): Promise<boolean> {
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });
  return member?.status === 'ACTIVE';
}

/**
 * Get league leaderboard.
 * Uses a single JOIN query against pre-computed user stats for optimal performance.
 */
export async function getLeagueLeaderboard(leagueId: string): Promise<LeaderboardEntry[]> {
  const results = await prisma.$queryRaw<
    Array<{
      userId: string;
      username: string;
      email: string;
      role: 'MEMBER' | 'ADMIN';
      totalPoints: number | bigint;
      betsWon: number | bigint;
      betsLost: number | bigint;
    }>
  >`
    SELECT
      u.id        AS "userId",
      u.username,
      u.email,
      lm.role,
      u."totalPoints",
      u."betsWon",
      u."betsLost"
    FROM "User" u
    INNER JOIN "LeagueMember" lm ON u.id = lm."userId"
    WHERE lm."leagueId" = ${leagueId}
      AND lm.status = 'ACTIVE'
    ORDER BY u."totalPoints" DESC
  `;

  return results.map((row) => {
    const betsWon = Number(row.betsWon);
    const betsLost = Number(row.betsLost);
    const totalBets = betsWon + betsLost;

    return {
      userId: row.userId,
      username: row.username,
      email: row.email,
      totalPoints: Number(row.totalPoints),
      betsWon,
      betsLost,
      winRate: totalBets > 0 ? Math.round((betsWon / totalBets) * 100) : 0,
      role: row.role,
    };
  });
}

/**
 * Get all pending join requests for a league.
 */
export async function getPendingJoinRequests(leagueId: string) {
  return prisma.leagueMember.findMany({
    where: { leagueId, status: 'PENDING' },
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
    orderBy: { joinedAt: 'desc' },
  });
}
