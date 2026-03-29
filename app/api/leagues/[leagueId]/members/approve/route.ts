import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { approveJoinRequest, isLeagueAdmin } from '@/lib/db/queries';
import { handleError, handleValidationError } from '@/lib/security/error-handler';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leagueId } = await params;

    const isAdmin = await isLeagueAdmin(leagueId, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only league admins can approve members' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return handleValidationError('User ID is required');
    }

    await approveJoinRequest(leagueId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Approve Member');
  }
}
