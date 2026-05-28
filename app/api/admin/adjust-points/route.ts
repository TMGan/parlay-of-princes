import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { adjustUserPoints } from '@/lib/db/queries';
import { canAdjustUserPoints } from '@/lib/auth/permissions';
import { handleError } from '@/lib/security/error-handler';
import { prisma } from '@/lib/db/client';

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const { userId, leagueId, amount, reason } = await req.json() as {
      userId: string;
      leagueId: string;
      amount: number;
      reason: string;
    };

    if (!userId || !leagueId || typeof amount !== 'number' || !reason?.trim()) {
      return NextResponse.json({ error: 'userId, leagueId, amount, and reason are required' }, { status: 400 });
    }

    if (amount === 0) {
      return NextResponse.json({ error: 'Amount cannot be zero' }, { status: 400 });
    }

    const [targetUser, membership] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.leagueMember.findUnique({
        where: { leagueId_userId: { leagueId, userId } },
      }),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not an active member of this league' }, { status: 400 });
    }

    if (!canAdjustUserPoints(admin.email, targetUser.email, targetUser.role)) {
      return NextResponse.json({ error: "You cannot adjust this user's points" }, { status: 403 });
    }

    await adjustUserPoints(userId, amount, reason.trim(), admin.id, leagueId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Adjust Points');
  }
}
