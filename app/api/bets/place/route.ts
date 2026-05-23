import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { createBet, getUserBetsForWeek, getUserLeagues } from "@/lib/db/queries";
import { isLeagueMember } from "@/lib/db/league-queries";
import { getWeekNumber } from "@/lib/utils/format";
import { rateLimit, createRateLimitResponse } from "@/lib/security/rate-limit";
import { sanitizeString, validateOdds } from "@/lib/security/validation";
import { handleError, handleValidationError } from "@/lib/security/error-handler";

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

    const rateLimitResult = rateLimit(`bet-place-${user.id}`, 20);
    if (!rateLimitResult.success) {
      return createRateLimitResponse("Too many bet attempts. Please wait 15 minutes.");
    }

    const { sport, description, oddsAmerican, gameStartTime, isKingLock, leagueId } = await req.json();

    const sanitizedSport = sanitizeString(sport, 50);
    const sanitizedDescription = sanitizeString(description, 500);
    const odds = Number(oddsAmerican);

    if (!sanitizedSport || !sanitizedDescription) {
      return handleValidationError("Invalid input");
    }
    if (!validateOdds(odds)) {
      return handleValidationError("Odds must be between +100 and +10000");
    }
    if (!gameStartTime || isNaN(new Date(gameStartTime).getTime())) {
      return handleValidationError("Invalid game time");
    }

    // Validate leagueId belongs to the user
    const resolvedLeagueId = leagueId ?? userLeagues[0]?.league.id;
    if (!resolvedLeagueId) {
      return handleValidationError("No league specified");
    }
    const memberCheck = await isLeagueMember(resolvedLeagueId, user.id);
    if (!memberCheck) {
      return NextResponse.json({ error: "You are not a member of this league" }, { status: 403 });
    }

    const currentWeek = getWeekNumber(new Date());
    // Bet limits are now PER LEAGUE
    const leagueBets = await getUserBetsForWeek(user.id, currentWeek, resolvedLeagueId);
    const regularBets = leagueBets.filter((bet) => !bet.isKingLock && !bet.isBonusBet);
    const existingKingLock = leagueBets.find((bet) => bet.isKingLock);

    if (isKingLock && existingKingLock) {
      return NextResponse.json(
        { error: "You have already placed your King Lock in this league this week" },
        { status: 400 }
      );
    }
    if (!isKingLock && regularBets.length >= 3) {
      return NextResponse.json(
        { error: "You have already placed 3 regular bets in this league this week" },
        { status: 400 }
      );
    }

    const bet = await createBet({
      userId: user.id,
      leagueId: resolvedLeagueId,
      weekNumber: currentWeek,
      sport: sanitizedSport,
      description: sanitizedDescription,
      oddsAmerican: odds,
      oddsLocked: odds,
      isKingLock,
      gameStartTime: new Date(gameStartTime),
    });

    return NextResponse.json({ success: true, bet });
  } catch (error: unknown) {
    return handleError(error, "Place Bet");
  }
}
