import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { handleError } from '@/lib/security/error-handler';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const memberships = await prisma.leagueMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { league: { select: { id: true, name: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json(
      memberships.map((m) => ({ id: m.league.id, name: m.league.name, leaguePoints: m.leaguePoints }))
    );
  } catch (error) {
    return handleError(error, 'User Leagues');
  }
}
