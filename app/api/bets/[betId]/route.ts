import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { deleteBet } from '@/lib/db/queries';
import { prisma } from '@/lib/db/client';
import { sanitizeString, validateOdds } from '@/lib/security/validation';
import { handleError, handleValidationError } from '@/lib/security/error-handler';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ betId: string }> }
) {
  try {
    const user = await requireAuth();
    const { betId } = await context.params;
    const { description, oddsAmerican } = await req.json();

    const bet = await prisma.bet.findUnique({ where: { id: betId } });
    if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    if (bet.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (bet.status !== 'PENDING') return handleValidationError('Can only edit pending bets');
    if (new Date(bet.gameStartTime) <= new Date()) return handleValidationError('Game has already started');

    const updates: Record<string, string | number> = {};

    if (description !== undefined) {
      const clean = sanitizeString(description, 500).trim();
      if (!clean) return handleValidationError('Description cannot be empty');
      updates.description = clean;
    }

    if (oddsAmerican !== undefined) {
      const odds = Number(oddsAmerican);
      if (!validateOdds(odds)) return handleValidationError('Odds must be between +100 and +10000');
      updates.oddsAmerican = odds;
      updates.oddsLocked = odds;
    }

    if (Object.keys(updates).length === 0) return handleValidationError('No changes provided');

    const updated = await prisma.bet.update({ where: { id: betId }, data: updates });
    return NextResponse.json({ success: true, bet: updated });
  } catch (error) {
    return handleError(error, 'Edit Bet');
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ betId: string }> }
) {
  try {
    const user = await requireAuth();
    const { betId } = await context.params;

    // Verify the bet belongs to the user and is still pending
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 });
    }

    if (bet.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (bet.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only delete pending bets' },
        { status: 400 }
      );
    }

    await deleteBet(betId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delete bet error:', error);

    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete bet' },
      { status: 500 }
    );
  }
}
