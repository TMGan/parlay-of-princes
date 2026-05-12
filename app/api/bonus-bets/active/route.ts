import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getActiveBonusBet, getUserBonusBetForWeek } from '@/lib/db/bonus-bet-queries';
import { getWeekNumber } from '@/lib/utils/format';
import { handleError } from '@/lib/security/error-handler';

export async function GET() {
  try {
    const user = await requireAuth();
    const bonusBet = await getActiveBonusBet();

    if (!bonusBet) {
      return NextResponse.json(null);
    }

    const currentWeek = getWeekNumber(new Date());
    const userClaim = await getUserBonusBetForWeek(user.id, currentWeek);

    return NextResponse.json({
      ...bonusBet,
      claimed: !!userClaim,
      claimedBet: userClaim ?? null,
    });
  } catch (error) {
    return handleError(error, 'Get Active Bonus Bet');
  }
}
