import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getActiveBonusBet, getUserClaimForBonusBet } from '@/lib/db/bonus-bet-queries';
import { handleError } from '@/lib/security/error-handler';

export async function GET() {
  try {
    const user = await requireAuth();
    const bonusBet = await getActiveBonusBet();

    if (!bonusBet) return NextResponse.json(null);

    // Scope the claim check to this specific bonus pick's window — not any bonus bet this week.
    const userClaim = await getUserClaimForBonusBet(user.id, bonusBet.id);

    return NextResponse.json({
      ...bonusBet,
      claimed: !!userClaim,
      claimedBet: userClaim ?? null,
    });
  } catch (error) {
    return handleError(error, 'Get Active Bonus Bet');
  }
}
