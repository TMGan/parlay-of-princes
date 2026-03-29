import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { canDeleteMessage, deleteMessage } from '@/lib/db/chat-queries';
import { handleError } from '@/lib/security/error-handler';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string; messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    const allowed = await canDeleteMessage(messageId, user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Cannot delete this message' }, { status: 403 });
    }

    await deleteMessage(messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Delete Message');
  }
}
