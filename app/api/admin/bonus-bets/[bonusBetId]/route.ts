import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { deleteBonusBet } from '@/lib/db/bonus-bet-queries';
import { handleError } from '@/lib/security/error-handler';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bonusBetId: string }> }
) {
  try {
    await requireAdmin();
    const { bonusBetId } = await params;
    await deleteBonusBet(bonusBetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Delete Bonus Bet');
  }
}
