import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.redirect(new URL("/api/auth/signout", process.env.NEXTAUTH_URL));
}
