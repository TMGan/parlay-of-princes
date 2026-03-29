import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getLeagueWithMembers, isLeagueMember } from '@/lib/db/queries';
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

    const league = await getLeagueWithMembers(leagueId);
    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    return NextResponse.json(league);
  } catch (error) {
    return handleError(error, 'Get League');
  }
}
