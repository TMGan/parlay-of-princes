import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { createBet, getUserBetsForWeek } from "@/lib/db/queries";
import { getWeekNumber } from "@/lib/utils/format";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const { sport, description, oddsAmerican, gameStartTime, isKingLock } = await req.json();

    // Validate odds
    if (oddsAmerican < 100) {
      return NextResponse.json(
        { error: "Odds must be +100 or higher (no negative odds allowed)" },
        { status: 400 }
      );
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
      sport,
      description,
      oddsAmerican,
      oddsLocked: oddsAmerican,
      isKingLock,
      gameStartTime: new Date(gameStartTime)
    });

    return NextResponse.json({ success: true, bet });
  } catch (error: any) {
    console.error("Place bet error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to place bet" }, { status: 500 });
  }
}
