/**
 * Sunday picks reminder — runs every Sunday at 4 PM UTC (12 PM ET during EDT).
 * Texts every opted-in user who hasn't placed ANY bets this week yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { sendSmsBulk } from '@/lib/services/sms';
import { getWeekNumber } from '@/lib/utils/format';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify legitimate cron call
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const currentWeek = getWeekNumber(now);

  // Find all opted-in users with a phone number
  const optedIn = await prisma.user.findMany({
    where: { smsOptIn: true, phoneNumber: { not: null } },
    select: { id: true, phoneNumber: true },
  });

  if (optedIn.length === 0) {
    return NextResponse.json({ message: 'No opted-in users', sent: 0 });
  }

  // Find which of those users already placed at least one bet this week
  const alreadyBet = await prisma.bet.findMany({
    where: {
      userId: { in: optedIn.map((u) => u.id) },
      weekNumber: currentWeek,
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  const alreadyBetIds = new Set(alreadyBet.map((b) => b.userId));

  // Only text users who haven't placed picks yet
  const toRemind = optedIn
    .filter((u) => !alreadyBetIds.has(u.id))
    .map((u) => u.phoneNumber!)
    .filter((n) => n.startsWith('+'));

  if (toRemind.length === 0) {
    return NextResponse.json({ message: 'All opted-in users have placed picks', sent: 0 });
  }

  const body =
    `⏰ Parlay of Princes — It's Sunday! You haven't placed your picks for Week ${currentWeek} yet. ` +
    `Log in before midnight to lock them in. 🏆`;

  await sendSmsBulk(toRemind, body);

  return NextResponse.json({
    message: 'Reminder sent',
    sent: toRemind.length,
    week: currentWeek,
  });
}
