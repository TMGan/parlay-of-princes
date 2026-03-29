import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/client';
import { handleError } from '@/lib/security/error-handler';

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (!isSuperAdmin(admin.email)) {
      return NextResponse.json(
        { error: 'Only super admin can view all leagues' },
        { status: 403 }
      );
    }

    const leagues = await prisma.league.findMany({
      include: {
        creator: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: {
            members: { where: { status: 'ACTIVE' } },
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leagues);
  } catch (error) {
    return handleError(error, 'Get All Leagues');
  }
}
