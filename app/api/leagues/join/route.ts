import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getLeagueByJoinCode, requestJoinLeague } from '@/lib/db/queries';
import { handleError, handleValidationError } from '@/lib/security/error-handler';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { joinCode } = body;

    if (!joinCode || typeof joinCode !== 'string') {
      return handleValidationError('Join code is required');
    }

    const sanitizedCode = joinCode.trim().toUpperCase();

    const league = await getLeagueByJoinCode(sanitizedCode);
    if (!league) {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
    }

    await requestJoinLeague(league.id, user.id);

    const message = league.isPublic
      ? 'Successfully joined league!'
      : 'Join request sent! Waiting for admin approval.';

    return NextResponse.json({
      success: true,
      message,
      leagueId: league.id,
      leagueName: league.name,
      needsApproval: !league.isPublic,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('Already a member') ||
        error.message.includes('already pending') ||
        error.message.includes('full')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return handleError(error, 'Join League');
  }
}
