import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { getLeagueMessages } from '@/lib/db/chat-queries';
import { handleError } from '@/lib/security/error-handler';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const admin = await requireAdmin();

    if (!isSuperAdmin(admin.email)) {
      return NextResponse.json(
        { error: 'Only super admin can view league messages' },
        { status: 403 }
      );
    }

    const { leagueId } = await params;
    const messages = await getLeagueMessages(leagueId, 100);

    return NextResponse.json(messages.reverse());
  } catch (error) {
    return handleError(error, 'Get League Messages');
  }
}
