import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createBet, getUserLeagues } from '@/lib/db/queries';
import { isLeagueMember } from '@/lib/db/league-queries';
import { getActiveBonusBet, getUserBonusBetForWeek } from '@/lib/db/bonus-bet-queries';
import { getWeekNumber } from '@/lib/utils/format';
import { handleError, handleValidationError } from '@/lib/security/error-handler';
import { sanitizeString, validateOdds } from '@/lib/security/validation';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const userLeagues = await getUserLeagues(user.id);
    if (userLeagues.length === 0) {
      return NextResponse.json({ error: 'You must join a league before placing bets' }, { status: 403 });
    }

    const rateLimitResult = rateLimit(`bonus-bet-${user.id}`, 5);
    if (!rateLimitResult.success) {
      return createRateLimitResponse('Too many attempts. Please wait 15 minutes.');
    }

    // User supplies their specific pick + odds + game time
    const { bonusBetId, description, oddsAmerican, gameStartTime, leagueId } = await req.json();

    if (!bonusBetId) return handleValidationError('bonusBetId is required');

    const sanitizedDescription = sanitizeString(description ?? '', 500);
    if (!sanitizedDescription) return handleValidationError('Pick description is required');

    const odds = Number(oddsAmerican);
    if (!validateOdds(odds)) return handleValidationError('Odds must be between +100 and +10000');

    if (!gameStartTime || isNaN(new Date(gameStartTime).getTime())) {
      return handleValidationError('Invalid game start time');
    }
    if (new Date(gameStartTime) <= new Date()) {
      return NextResponse.json({ error: 'Game has already started' }, { status: 400 });
    }

    // Validate league membership
    const resolvedLeagueId = leagueId ?? userLeagues[0]?.league.id;
    if (!resolvedLeagueId) return handleValidationError('No league specified');
    const memberCheck = await isLeagueMember(resolvedLeagueId, user.id);
    if (!memberCheck) {
      return NextResponse.json({ error: 'You are not a member of this league' }, { status: 403 });
    }

    const bonusBet = await getActiveBonusBet();
    if (!bonusBet || bonusBet.id !== bonusBetId) {
      return NextResponse.json({ error: 'This bonus pick is no longer available' }, { status: 400 });
    }

    const currentWeek = getWeekNumber(new Date());
    const existing = await getUserBonusBetForWeek(user.id, currentWeek);
    if (existing) {
      return NextResponse.json({ error: 'You have already claimed a bonus pick this week' }, { status: 400 });
    }

    const bet = await createBet({
      userId: user.id,
      leagueId: resolvedLeagueId,
      weekNumber: currentWeek,
      sport: bonusBet.sport,
      description: sanitizedDescription,
      oddsAmerican: odds,
      oddsLocked: odds,
      isKingLock: false,
      isBonusBet: true,
      bonusBetId: bonusBet.id,
      gameStartTime: new Date(gameStartTime),
    });

    return NextResponse.json({ success: true, bet }, { status: 201 });
  } catch (error) {
    return handleError(error, 'Place Bonus Bet');
  }
}
