import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { sanitizeString, validateOdds } from '@/lib/security/validation';
import { handleError } from '@/lib/security/error-handler';
import { getWeekNumber } from '@/lib/utils/format';

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const rateLimitResult = rateLimit(`historical-bet-${admin.id}`, 20);
    if (!rateLimitResult.success) {
      return createRateLimitResponse('Too many historical bet additions. Please wait.');
    }

    const body = await req.json();
    const { userId, weekNumber, sport, description, oddsAmerican, gameStartTime, isKingLock } = body;

    if (!userId || !weekNumber || !sport || !description || !oddsAmerican || !gameStartTime) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const currentWeek = getWeekNumber(new Date());
    const minWeek = Math.max(1, currentWeek - 26);
    const maxWeek = currentWeek - 1;
    const parsedWeek = Number(weekNumber);

    if (Number.isNaN(parsedWeek) || parsedWeek < minWeek || parsedWeek > maxWeek) {
      return NextResponse.json(
        { error: `Week must be between ${minWeek} and ${maxWeek}` },
        { status: 400 }
      );
    }

    const sanitizedSport = sanitizeString(sport, 50);
    const sanitizedDescription = sanitizeString(description, 500);
    const oddsValue = Number(oddsAmerican);

    if (!validateOdds(oddsValue)) {
      return NextResponse.json(
        { error: 'Odds must be between +100 and +10000' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingBets = await prisma.bet.findMany({
      where: {
        userId,
        weekNumber: parsedWeek,
      },
    });

    const regularBets = existingBets.filter((bet) => !bet.isKingLock);
    const hasKingLock = existingBets.some((bet) => bet.isKingLock);

    if (isKingLock && hasKingLock) {
      return NextResponse.json(
        { error: `User already has a King Lock for week ${parsedWeek}` },
        { status: 400 }
      );
    }

    if (!isKingLock && regularBets.length >= 3) {
      return NextResponse.json(
        { error: `User already has 3 regular bets for week ${parsedWeek}` },
        { status: 400 }
      );
    }

    const bet = await prisma.bet.create({
      data: {
        userId,
        weekNumber: parsedWeek,
        sport: sanitizedSport,
        description: sanitizedDescription,
        oddsAmerican: oddsValue,
        gameStartTime: new Date(gameStartTime),
        isKingLock,
        status: 'PENDING',
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    return handleError(error, 'Historical Bet Creation');
  }
}
