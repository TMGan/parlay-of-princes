import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { createBet, getUserBetsForWeek } from "@/lib/db/queries";
import { getWeekNumber } from "@/lib/utils/format";
import { rateLimit, createRateLimitResponse } from "@/lib/security/rate-limit";
import { sanitizeString, validateOdds } from "@/lib/security/validation";
import { handleError, handleValidationError } from "@/lib/security/error-handler";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    // Rate limiting: 20 bets per 15 minutes per user
    const rateLimitResult = rateLimit(`bet-place-${user.id}`, 20);
    if (!rateLimitResult.success) {
      return createRateLimitResponse("Too many bet attempts. Please wait 15 minutes.");
    }

    const { sport, description, oddsAmerican, gameStartTime, isKingLock } = await req.json();

    // Input validation
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

    const currentWeek = getWeekNumber(new Date());
    const userBets = await getUserBetsForWeek(user.id, currentWeek);

    // Check bet limits
    const regularBets = userBets.filter((bet) => !bet.isKingLock);
    const existingKingLock = userBets.find((bet) => bet.isKingLock);

    if (isKingLock && existingKingLock) {
      return NextResponse.json(
        { error: "You have already placed your King Lock for this week" },
        { status: 400 }
      );
    }

    if (!isKingLock && regularBets.length >= 3) {
      return NextResponse.json(
        { error: "You have already placed 3 regular bets this week" },
        { status: 400 }
      );
    }

    const bet = await createBet({
      userId: user.id,
      weekNumber: currentWeek,
      sport: sanitizedSport,
      description: sanitizedDescription,
      oddsAmerican: odds,
      oddsLocked: odds,
      isKingLock,
      gameStartTime: new Date(gameStartTime)
    });

    return NextResponse.json({ success: true, bet });
  } catch (error: any) {
    return handleError(error, "Place Bet");
  }
}
