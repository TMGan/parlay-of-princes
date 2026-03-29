import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { adjustUserPoints } from '@/lib/db/queries';
import { canAdjustUserPoints } from '@/lib/auth/permissions';
import { handleError } from '@/lib/security/error-handler';
import { prisma } from '@/lib/db/client';

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const { userId, amount, reason }: { userId: string; amount: number; reason: string } =
      await req.json();

    if (!userId || typeof amount !== 'number' || !reason) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (amount === 0) {
      return NextResponse.json({ error: 'Amount cannot be zero' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!canAdjustUserPoints(admin.email, targetUser.email, targetUser.role)) {
      return NextResponse.json(
        { error: "You cannot adjust this user's points" },
        { status: 403 }
      );
    }

    await adjustUserPoints(userId, amount, reason, admin.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Adjust Points');
  }
}
