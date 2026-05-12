import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createBet, getUserLeagues } from '@/lib/db/queries';
import {
  getActiveBonusBet,
  getUserBonusBetForWeek,
  type BonusBetParameters,
} from '@/lib/db/bonus-bet-queries';
import { getWeekNumber } from '@/lib/utils/format';
import { handleError, handleValidationError } from '@/lib/security/error-handler';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const userLeagues = await getUserLeagues(user.id);
    if (userLeagues.length === 0) {
      return NextResponse.json(
        { error: 'You must join a league before placing bets' },
        { status: 403 }
      );
    }

    const rateLimitResult = rateLimit(`bonus-bet-${user.id}`, 5);
    if (!rateLimitResult.success) {
      return createRateLimitResponse('Too many attempts. Please wait 15 minutes.');
    }

    const { bonusBetId } = await req.json();
    if (!bonusBetId) {
      return handleValidationError('bonusBetId is required');
    }

    const bonusBet = await getActiveBonusBet();
    if (!bonusBet || bonusBet.id !== bonusBetId) {
      return NextResponse.json({ error: 'This bonus bet is no longer available' }, { status: 400 });
    }

    const currentWeek = getWeekNumber(new Date());
    const existing = await getUserBonusBetForWeek(user.id, currentWeek);
    if (existing) {
      return NextResponse.json(
        { error: 'You have already claimed the bonus pick this week' },
        { status: 400 }
      );
    }

    const params = bonusBet.parameters as BonusBetParameters;
    const gameStart = new Date(params.gameStartTime);

    if (gameStart <= new Date()) {
      return NextResponse.json(
        { error: 'This game has already started' },
        { status: 400 }
      );
    }

    const bet = await createBet({
      userId: user.id,
      weekNumber: currentWeek,
      sport: params.sport,
      description: bonusBet.description,
      oddsAmerican: params.oddsAmerican,
      oddsLocked: params.oddsAmerican,
      isKingLock: false,
      isBonusBet: true,
      bonusBetId: bonusBet.id,
      gameStartTime: gameStart,
    });

    return NextResponse.json({ success: true, bet }, { status: 201 });
  } catch (error) {
    return handleError(error, 'Place Bonus Bet');
  }
}
