import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { handleError, handleValidationError } from '@/lib/security/error-handler';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { sanitizeString } from '@/lib/security/validation';

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();

    const rateLimitResult = rateLimit(`profile-update-${user.id}`, 5);
    if (!rateLimitResult.success) {
      return createRateLimitResponse('Too many attempts. Please wait 15 minutes.');
    }

    const body = await req.json();
    const { currentPassword, newUsername, newPassword } = body;

    if (!currentPassword) {
      return handleValidationError('Current password is required');
    }

    // Verify current password
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return handleValidationError('User not found');

    const passwordValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const updates: Record<string, string> = {};

    if (newUsername) {
      const sanitized = sanitizeString(newUsername, 30).trim();
      if (sanitized.length < 3) {
        return handleValidationError('Username must be at least 3 characters');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
        return handleValidationError('Username can only contain letters, numbers, underscores and hyphens');
      }
      const taken = await prisma.user.findUnique({ where: { username: sanitized } });
      if (taken && taken.id !== user.id) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
      updates.username = sanitized;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return handleValidationError('New password must be at least 8 characters');
      }
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      return handleValidationError('No changes provided');
    }

    await prisma.user.update({ where: { id: user.id }, data: updates });

    return NextResponse.json({ success: true, updatedFields: Object.keys(updates) });
  } catch (error) {
    return handleError(error, 'Update Profile');
  }
}
