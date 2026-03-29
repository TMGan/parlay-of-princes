import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isLeagueMember } from '@/lib/db/league-queries';
import { getLeagueMessages, createMessage } from '@/lib/db/chat-queries';
import { handleError, handleValidationError } from '@/lib/security/error-handler';
import { sanitizeString } from '@/lib/security/validation';

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

    const messages = await getLeagueMessages(leagueId);

    return NextResponse.json(messages);
  } catch (error) {
    return handleError(error, 'Get Messages');
  }
}

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

    const isMember = await isLeagueMember(leagueId, user.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return handleValidationError('Message content is required');
    }

    const sanitized = sanitizeString(content, 500);
    if (sanitized.length === 0) {
      return handleValidationError('Message cannot be empty');
    }

    const message = await createMessage(leagueId, user.id, sanitized);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return handleError(error, 'Send Message');
  }
}
