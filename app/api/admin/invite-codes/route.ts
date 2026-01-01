import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createInviteCode } from "@/lib/db/queries";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { code } = await req.json();

    if (!code || code.length < 4) {
      return NextResponse.json({ error: "Code must be at least 4 characters" }, { status: 400 });
    }

    const inviteCode = await createInviteCode(code.toUpperCase());

    return NextResponse.json({ success: true, inviteCode });
  } catch (error: any) {
    console.error("Create invite code error:", error);

    if (error.message === "Forbidden - Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to create invite code" }, { status: 500 });
  }
}
