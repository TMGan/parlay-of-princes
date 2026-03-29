import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserLeagues } from '@/lib/db/queries';
import { handleError } from '@/lib/security/error-handler';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leagues = await getUserLeagues(user.id);

    return NextResponse.json(leagues);
  } catch (error) {
    return handleError(error, 'Get My Leagues');
  }
}
