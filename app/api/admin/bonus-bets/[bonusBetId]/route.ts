import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { deleteBonusBet, updateBonusBet } from '@/lib/db/bonus-bet-queries';
import { handleError, handleValidationError } from '@/lib/security/error-handler';
import { sanitizeString, validateOdds } from '@/lib/security/validation';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bonusBetId: string }> }
) {
  try {
    await requireAdmin();
    const { bonusBetId } = await params;
    const body = await req.json();
    const { name, description, sport, oddsAmerican, gameStartTime, availableDate, expiryDate } = body;

    const sanitizedName = sanitizeString(name ?? '', 100);
    const sanitizedDescription = sanitizeString(description ?? '', 500);
    const sanitizedSport = sanitizeString(sport ?? '', 50);

    if (!sanitizedName || !sanitizedDescription || !sanitizedSport || !oddsAmerican || !gameStartTime || !availableDate || !expiryDate) {
      return handleValidationError('All fields are required');
    }
    const odds = Number(oddsAmerican);
    if (!validateOdds(odds)) return handleValidationError('Odds must be between +100 and +10000');

    const available = new Date(availableDate);
    const expiry = new Date(expiryDate);
    const gameStart = new Date(gameStartTime);
    if (isNaN(available.getTime()) || isNaN(expiry.getTime()) || isNaN(gameStart.getTime())) {
      return handleValidationError('Invalid date values');
    }
    if (expiry <= available) return handleValidationError('Expiry must be after available date');

    const updated = await updateBonusBet(bonusBetId, {
      name: sanitizedName,
      description: sanitizedDescription,
      parameters: { sport: sanitizedSport, oddsAmerican: odds, gameStartTime: gameStart.toISOString() },
      availableDate: available,
      expiryDate: expiry,
    });

    return NextResponse.json({ success: true, bonusBet: updated });
  } catch (error) {
    return handleError(error, 'Update Bonus Bet');
  }
}

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
