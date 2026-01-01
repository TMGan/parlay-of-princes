import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { updateBetStatus, updateUserStats } from "@/lib/db/queries";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { betId, status } = await req.json();

    if (!betId || !status) {
      return NextResponse.json({ error: "betId and status are required" }, { status: 400 });
    }

    if (!["WON", "LOST", "VOIDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update bet status (this also calculates and awards points)
    const bet = await updateBetStatus(betId, status);

    // Recalculate user stats
    await updateUserStats(bet.userId);

    return NextResponse.json({ success: true, bet });
  } catch (error: any) {
    console.error("Resolve bet error:", error);

    if (error.message === "Forbidden - Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to resolve bet" }, { status: 500 });
  }
}
