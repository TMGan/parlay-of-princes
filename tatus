import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { deleteBet } from '@/lib/db/queries';
import { prisma } from '@/lib/db/client';

export async function DELETE(
  req: Request,
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
  } catch (error: any) {
    console.error('Delete bet error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete bet' },
      { status: 500 }
    );
  }
}