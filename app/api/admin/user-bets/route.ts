import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getUserWithDetails } from '@/lib/db/queries';
import { handleError } from '@/lib/security/error-handler';

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await getUserWithDetails(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.bets);
  } catch (error) {
    return handleError(error, 'Get User Bets');
  }
}
