import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { updateBetStatus, updateUserStats } from "@/lib/db/queries";
import { updateLeagueMemberStats } from "@/lib/db/league-queries";
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
    await updateUserStats(bet.userId);
    await updateLeagueMemberStats(bet.userId);

    return NextResponse.json({ success: true, bet });
  } catch (error) {
    return handleError(error, "Resolve Bet");
  }
}
