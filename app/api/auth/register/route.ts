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
import { rateLimit, createRateLimitResponse } from "@/lib/security/rate-limit";
import {
  sanitizeEmail,
  sanitizeString,
  validateEmail,
  validateUsername,
  validatePassword,
  validateInviteCode as validateInviteCodeFormat
} from "@/lib/security/validation";
import { handleError, handleValidationError } from "@/lib/security/error-handler";

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 registration attempts per hour per IP
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
    const rateLimitResult = rateLimit(`register-${ip}`, 5, 60 * 60 * 1000);
    if (!rateLimitResult.success) {
      return createRateLimitResponse("Too many registration attempts. Please try again in an hour.");
    }

    const body = await req.json();
    const { email, username, password, inviteCode } = body;

    // Input validation and sanitization
    const sanitizedEmail = sanitizeEmail(typeof email === "string" ? email : "");
    const sanitizedUsername = sanitizeString(typeof username === "string" ? username : "", 30);
    const sanitizedCode = typeof inviteCode === "string" ? inviteCode.trim().toUpperCase() : "";

    if (!validateEmail(sanitizedEmail)) {
      return handleValidationError("Invalid email format");
    }

    if (!validateUsername(sanitizedUsername)) {
      return handleValidationError("Username must be 3-30 characters, alphanumeric and underscores only");
    }

    if (!validatePassword(typeof password === "string" ? password : "")) {
      return handleValidationError("Password must be at least 8 characters");
    }

    if (!validateInviteCodeFormat(sanitizedCode)) {
      return handleValidationError("Invalid invite code format");
    }

    // Validate input with schema after sanitization
    const validatedData = registerSchema.parse({
      email: sanitizedEmail,
      username: sanitizedUsername,
      password,
      inviteCode: sanitizedCode
    });

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
    if (error.name === "ZodError") {
      return handleValidationError("Validation failed");
    }

    return handleError(error, "Register");
  }
}
