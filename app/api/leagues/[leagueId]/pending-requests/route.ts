import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isLeagueAdmin } from '@/lib/db/league-queries';
import { getPendingJoinRequests } from '@/lib/db/queries';
import { handleError } from '@/lib/security/error-handler';

export async function GET(
  _req: Request,
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
      return NextResponse.json({ error: 'Only league admins can view pending requests' }, { status: 403 });
    }

    const requests = await getPendingJoinRequests(leagueId);

    return NextResponse.json(requests);
  } catch (error) {
    return handleError(error, 'Get Pending Requests');
  }
}
