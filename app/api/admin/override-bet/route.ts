import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { handleError } from '@/lib/security/error-handler';
import { updateUserStats } from '@/lib/db/queries';

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { betId }: { betId: string } = await req.json();

    if (!betId) {
      return NextResponse.json({ error: 'Bet ID required' }, { status: 400 });
    }

    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { user: true },
    });

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.status !== 'WON' && bet.status !== 'LOST') {
      return NextResponse.json(
        { error: 'Can only override resolved bets (WON or LOST)' },
        { status: 400 }
      );
    }

    const newStatus = bet.status === 'WON' ? 'LOST' : 'WON';
    const oldPoints = bet.pointsAwarded ?? 0;
    const baseOdds = bet.oddsLocked ?? bet.oddsAmerican;
    const newPoints = newStatus === 'WON' ? (bet.isKingLock ? baseOdds * 2 : baseOdds) : 0;
    const pointsAdjustment = newPoints - oldPoints;

    await prisma.bet.update({
      where: { id: betId },
      data: {
        status: newStatus,
        pointsAwarded: newPoints,
        resolvedAt: new Date(),
      },
    });

    await updateUserStats(bet.userId);

    return NextResponse.json({
      success: true,
      oldStatus: bet.status,
      newStatus,
      pointsAdjustment,
    });
  } catch (error) {
    return handleError(error, 'Override Bet');
  }
}
