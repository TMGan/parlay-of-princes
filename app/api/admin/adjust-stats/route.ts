import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { canAdjustUserPoints } from '@/lib/auth/permissions';
import { handleError } from '@/lib/security/error-handler';
import { prisma } from '@/lib/db/client';
import { updateUserStats, updateLeagueMemberStats } from '@/lib/db/queries';

interface RequestBody {
  userId: string;
  leagueId: string;
  // Global (User-level) overrides
  betsWonOffset?: number;
  biggestHitOverride?: number | null; // null clears the override
  // League (LeagueMember-level) overrides — always required when leagueId provided
  leagueBetsWonOffset?: number;
  leagueBiggestHitOverride?: number | null;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const body = (await req.json()) as RequestBody;
    const { userId, leagueId, betsWonOffset, biggestHitOverride, leagueBetsWonOffset, leagueBiggestHitOverride } = body;

    if (!userId || !leagueId) {
      return NextResponse.json({ error: 'userId and leagueId are required' }, { status: 400 });
    }

    const hasGlobalChange = betsWonOffset !== undefined || biggestHitOverride !== undefined;
    const hasLeagueChange = leagueBetsWonOffset !== undefined || leagueBiggestHitOverride !== undefined;

    if (!hasGlobalChange && !hasLeagueChange) {
      return NextResponse.json({ error: 'At least one stat override must be provided' }, { status: 400 });
    }

    const [targetUser, membership] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.leagueMember.findUnique({ where: { leagueId_userId: { leagueId, userId } } }),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this league' }, { status: 400 });
    }
    if (!canAdjustUserPoints(admin.email, targetUser.email, targetUser.role)) {
      return NextResponse.json({ error: "You cannot adjust this user's stats" }, { status: 403 });
    }

    // Apply user-level overrides
    if (hasGlobalChange) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(betsWonOffset !== undefined ? { betsWonOffset } : {}),
          // undefined means "no change"; null means "clear override"
          ...(biggestHitOverride !== undefined ? { biggestHitOverride } : {}),
        },
      });
    }

    // Apply league-level overrides
    if (hasLeagueChange) {
      await prisma.leagueMember.update({
        where: { leagueId_userId: { leagueId, userId } },
        data: {
          ...(leagueBetsWonOffset !== undefined ? { leagueBetsWonOffset } : {}),
          ...(leagueBiggestHitOverride !== undefined ? { leagueBiggestHitOverride } : {}),
        },
      });
    }

    // Recalculate derived stats so the new overrides take effect immediately
    await Promise.all([
      updateUserStats(userId),
      updateLeagueMemberStats(userId, leagueId),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Adjust Stats');
  }
}
