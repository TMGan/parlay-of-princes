import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { createBonusBet, getAllBonusBets } from '@/lib/db/bonus-bet-queries';
import { handleError, handleValidationError } from '@/lib/security/error-handler';
import { sanitizeString, validateOdds } from '@/lib/security/validation';

export async function GET() {
  try {
    await requireAdmin();
    const bonusBets = await getAllBonusBets();
    return NextResponse.json(bonusBets);
  } catch (error) {
    return handleError(error, 'Get Bonus Bets');
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const { name, description, sport, oddsAmerican, gameStartTime, availableDate, expiryDate } =
      body;

    const sanitizedName = sanitizeString(name ?? '', 100);
    const sanitizedDescription = sanitizeString(description ?? '', 500);
    const sanitizedSport = sanitizeString(sport ?? '', 50);

    if (
      !sanitizedName ||
      !sanitizedDescription ||
      !sanitizedSport ||
      !oddsAmerican ||
      !gameStartTime ||
      !availableDate ||
      !expiryDate
    ) {
      return handleValidationError('All fields are required');
    }

    const odds = Number(oddsAmerican);
    if (!validateOdds(odds)) {
      return handleValidationError('Odds must be between +100 and +10000');
    }

    const available = new Date(availableDate);
    const expiry = new Date(expiryDate);
    const gameStart = new Date(gameStartTime);

    if (isNaN(available.getTime()) || isNaN(expiry.getTime()) || isNaN(gameStart.getTime())) {
      return handleValidationError('Invalid date values');
    }

    if (expiry <= available) {
      return handleValidationError('Expiry date must be after available date');
    }

    const bonusBet = await createBonusBet({
      name: sanitizedName,
      description: sanitizedDescription,
      parameters: { sport: sanitizedSport, oddsAmerican: odds, gameStartTime: gameStart.toISOString() },
      availableDate: available,
      expiryDate: expiry,
      createdByUserId: admin.id,
    });

    return NextResponse.json({ success: true, bonusBet }, { status: 201 });
  } catch (error) {
    return handleError(error, 'Create Bonus Bet');
  }
}
