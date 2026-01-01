import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/auth";
import {
  createUser,
  validateInviteCode,
  markInviteCodeAsUsed,
  getUserByEmail,
  getUserByUsername
} from "@/lib/db/queries";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if invite code is valid
    const isValidCode = await validateInviteCode(validatedData.inviteCode);
    if (!isValidCode) {
      return NextResponse.json({ error: "Invalid or already used invite code" }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await getUserByEmail(validatedData.email);
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Check if username already exists
    const existingUsername = await getUserByUsername(validatedData.username);
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await createUser({
      email: validatedData.email,
      username: validatedData.username,
      password: hashedPassword,
      inviteCodeUsed: validatedData.inviteCode
    });

    // Mark invite code as used
    await markInviteCodeAsUsed(validatedData.inviteCode, user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
