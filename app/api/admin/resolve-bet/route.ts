import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { updateBetStatus, updateUserStats, getUserById } from "@/lib/db/queries";
import { updateLeagueMemberStats, createBetResolvedActivities } from "@/lib/db/league-queries";
import { handleError, handleValidationError } from "@/lib/security/error-handler";

const VALID_STATUSES = new Set(["WON", "LOST", "VOIDED"]);

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { betId, status } = await req.json();

    if (!betId || !status) {
      return handleValidationError("betId and status are required");
    }

    if (!VALID_STATUSES.has(status)) {
      return handleValidationError("Status must be WON, LOST, or VOIDED");
    }

    const bet = await updateBetStatus(betId, status);
    const [user] = await Promise.all([
      getUserById(bet.userId),
      updateUserStats(bet.userId),
      updateLeagueMemberStats(bet.userId),
    ]);

    if (user && (status === 'WON' || status === 'LOST' || status === 'VOIDED')) {
      await createBetResolvedActivities(
        bet.userId,
        user.username,
        bet.description,
        status as 'WON' | 'LOST' | 'VOIDED',
        bet.pointsAwarded
      );
    }

    return NextResponse.json({ success: true, bet });
  } catch (error) {
    return handleError(error, "Resolve Bet");
  }
}
