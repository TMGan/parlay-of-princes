import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { changeUserRole } from '@/lib/db/queries';
import { canManageAdmins } from '@/lib/auth/permissions';
import { handleError } from '@/lib/security/error-handler';
import { prisma } from '@/lib/db/client';

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const { userId, newRole }: { userId: string; newRole: 'USER' | 'ADMIN' } = await req.json();

    if (newRole === 'ADMIN' && !canManageAdmins(admin.email)) {
      return NextResponse.json(
        { error: 'Only super admin can promote users to admin' },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (targetUser?.email === 'admin@parlayofprinces.com') {
      return NextResponse.json(
        { error: 'Cannot change super admin role' },
        { status: 403 }
      );
    }

    await changeUserRole(userId, newRole);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Change Role');
  }
}
