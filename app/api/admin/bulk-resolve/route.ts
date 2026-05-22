import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { updateBetStatus, updateUserStats, getUserById } from '@/lib/db/queries';
import { updateLeagueMemberStats, createBetResolvedActivities } from '@/lib/db/league-queries';
import { handleError, handleValidationError } from '@/lib/security/error-handler';

const VALID_STATUSES = new Set(['WON', 'LOST', 'VOIDED']);

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { betIds, status } = await req.json();

    if (!Array.isArray(betIds) || betIds.length === 0) {
      return handleValidationError('betIds must be a non-empty array');
    }
    if (!VALID_STATUSES.has(status)) {
      return handleValidationError('Status must be WON, LOST, or VOIDED');
    }

    const bets = await prisma.bet.findMany({
      where: { id: { in: betIds }, status: 'PENDING' },
    });

    if (bets.length === 0) {
      return handleValidationError('No pending bets found for given IDs');
    }

    // Resolve each bet and update stats
    const uniqueUserIds = [...new Set(bets.map((b) => b.userId))];

    await Promise.all(
      bets.map((bet) => updateBetStatus(bet.id, status as 'WON' | 'LOST' | 'VOIDED'))
    );

    // Re-fetch resolved bets for accurate pointsAwarded
    const resolvedBets = await prisma.bet.findMany({ where: { id: { in: betIds } } });

    await Promise.all(
      uniqueUserIds.flatMap((userId) => [
        updateUserStats(userId),
        updateLeagueMemberStats(userId),
      ])
    );

    // Activity feed entries
    await Promise.all(
      resolvedBets.map(async (bet) => {
        const user = await getUserById(bet.userId);
        if (user) {
          await createBetResolvedActivities(
            bet.userId,
            user.username,
            bet.description,
            status as 'WON' | 'LOST' | 'VOIDED',
            bet.pointsAwarded
          );
        }
      })
    );

    return NextResponse.json({ success: true, resolved: resolvedBets.length });
  } catch (error) {
    return handleError(error, 'Bulk Resolve');
  }
}
