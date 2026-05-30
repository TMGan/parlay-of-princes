/**
 * Auto-grader cron job — runs daily via Vercel Cron.
 * Checks all pending bets whose game start time has passed and resolves them
 * using The Odds API scores first, then falls back to Claude AI.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/client';
import { updateBetStatus, updateUserStats, getUserById } from '@/lib/db/queries';
import { updateLeagueMemberStats, createBetResolvedActivities } from '@/lib/db/league-queries';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const CRON_SECRET = process.env.CRON_SECRET;

type BetStatus = 'WON' | 'LOST' | 'VOIDED';

// Resolve a single bet and update all derived stats
async function resolveBet(betId: string, status: BetStatus, reason: string) {
  const bet = await updateBetStatus(betId, status);
  const [user] = await Promise.all([
    getUserById(bet.userId),
    updateUserStats(bet.userId),
    updateLeagueMemberStats(bet.userId, bet.leagueId ?? undefined),
  ]);
  if (user) {
    await createBetResolvedActivities(
      bet.userId,
      user.username,
      bet.description,
      status,
      bet.pointsAwarded
    );
  }
  console.log(`[grade-bets] resolved bet ${betId} → ${status} (${reason})`);
  return bet;
}

// Map sport names to Odds API sport keys (best effort)
function sportToOddsApiKey(sport: string): string | null {
  const s = sport.toLowerCase();
  if (s.includes('nfl') || s.includes('football')) return 'americanfootball_nfl';
  if (s.includes('nba') || s.includes('basketball')) return 'basketball_nba';
  if (s.includes('mlb') || s.includes('baseball')) return 'baseball_mlb';
  if (s.includes('nhl') || s.includes('hockey')) return 'icehockey_nhl';
  if (s.includes('soccer') || s.includes('mls')) return 'soccer_usa_mls';
  if (s.includes('tennis')) return 'tennis_atp_french_open';
  if (s.includes('golf') || s.includes('pga')) return 'golf_pga_tour_winner';
  if (s.includes('ufc') || s.includes('mma')) return 'mma_mixed_martial_arts';
  return null;
}

// Try The Odds API scores endpoint for a specific sport/date window
async function checkScoresFromOddsApi(
  sportKey: string,
  gameDateIso: string // "2024-01-15"
): Promise<{ completed: boolean; scores: Record<string, string | number> | null }> {
  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/scores?apiKey=${ODDS_API_KEY}&daysFrom=3`;
    const res = await fetch(url);
    if (!res.ok) return { completed: false, scores: null };
    const events = await res.json() as Array<{
      id: string;
      completed: boolean;
      commence_time: string;
      scores: Array<{ name: string; score: string }> | null;
    }>;

    // Find events on the same calendar date
    const targetDate = gameDateIso.slice(0, 10);
    const relevantCompleted = events.filter(
      (e) =>
        e.completed &&
        e.commence_time.slice(0, 10) === targetDate &&
        e.scores
    );

    if (relevantCompleted.length === 0) return { completed: false, scores: null };

    // Return aggregated scores info as a simple object for the AI prompt
    const scoresInfo: Record<string, string> = {};
    for (const ev of relevantCompleted) {
      if (ev.scores) {
        for (const s of ev.scores) {
          scoresInfo[s.name] = s.score;
        }
      }
    }
    return { completed: true, scores: scoresInfo };
  } catch {
    return { completed: false, scores: null };
  }
}

// Use Claude to decide WON / LOST / VOIDED given bet description + any available scores
async function gradeWithClaude(
  description: string,
  sport: string,
  gameDate: string,
  scoresContext: string
): Promise<BetStatus | null> {
  try {
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 32,
      messages: [
        {
          role: 'user',
          content: `You are a sports bet grader. Grade this bet as WON, LOST, VOIDED, or UNCERTAIN.

Bet: "${description}"
Sport: ${sport}
Game date: ${gameDate}
${scoresContext ? `Scores/results context:\n${scoresContext}` : 'No scores context available.'}

Rules:
- WON: you have clear evidence the bettor's pick was correct.
- LOST: you have clear evidence the bettor's pick was incorrect.
- VOIDED: the game/event was officially cancelled, postponed, or the bet was invalid. Only use this if you have evidence of cancellation.
- UNCERTAIN: you do not have enough information to determine the outcome. Use this whenever you are not confident.

Reply with exactly one word: WON, LOST, VOIDED, or UNCERTAIN.`,
        },
      ],
    });

    const text =
      message.content[0]?.type === 'text' ? message.content[0].text.trim().toUpperCase() : '';
    if (text === 'WON' || text === 'LOST' || text === 'VOIDED') return text;
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron call
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Fetch all PENDING bets where the game has started (gameStartTime in the past)
  const pendingBets = await prisma.bet.findMany({
    where: {
      status: 'PENDING',
      gameStartTime: { lt: now },
    },
    take: 50, // Process at most 50 per run to stay within function timeout
  });

  if (pendingBets.length === 0) {
    return NextResponse.json({ message: 'No pending bets to grade', resolved: 0 });
  }

  let resolved = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const bet of pendingBets) {
    try {
      const sportKey = bet.sport ? sportToOddsApiKey(bet.sport) : null;
      const gameDateIso = bet.gameStartTime.toISOString().slice(0, 10);

      let oddsApiScores: Record<string, string | number> | null = null;
      let oddsApiCompleted = false;

      // Try The Odds API first
      if (ODDS_API_KEY && sportKey) {
        const result = await checkScoresFromOddsApi(sportKey, gameDateIso);
        oddsApiCompleted = result.completed;
        oddsApiScores = result.scores;
      }

      // If game not marked completed in Odds API, skip for now (game may still be live)
      // Give 6 hours after game start before skipping
      const hoursSinceStart =
        (now.getTime() - bet.gameStartTime.getTime()) / 1000 / 60 / 60;

      if (!oddsApiCompleted && hoursSinceStart < 6) {
        skipped++;
        continue;
      }

      // Build context string from scores
      const scoresContext = oddsApiScores
        ? Object.entries(oddsApiScores)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        : '';

      // Grade with Claude AI
      const status = await gradeWithClaude(
        bet.description,
        bet.sport ?? 'Unknown',
        gameDateIso,
        scoresContext
      );

      if (!status) {
        // Could not grade — leave for admin to resolve manually
        skipped++;
        continue;
      }

      await resolveBet(bet.id, status, oddsApiCompleted ? 'odds-api+claude' : 'claude-only');
      resolved++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      errors.push(`bet ${bet.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    message: 'Grading complete',
    total: pendingBets.length,
    resolved,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
