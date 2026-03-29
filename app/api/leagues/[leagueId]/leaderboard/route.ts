import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getLeagueLeaderboard, isLeagueMember } from '@/lib/db/queries';
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

    const isMember = await isLeagueMember(leagueId, user.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 });
    }

    const leaderboard = await getLeagueLeaderboard(leagueId);

    return NextResponse.json(leaderboard);
  } catch (error) {
    return handleError(error, 'Get Leaderboard');
  }
}
