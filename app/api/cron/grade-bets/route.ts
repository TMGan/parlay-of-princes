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

/**
 * Map a sport label to a prioritised list of Odds API sport keys.
 * Multiple keys are tried in order — the first one that returns completed
 * scores wins. This avoids failures when a specific tournament key (e.g.
 * French Open) is no longer active.
 */
function sportToOddsApiKeys(sport: string): string[] {
  const s = sport.toLowerCase();

  if (s.includes('nfl') || (s.includes('football') && !s.includes('soccer') && !s.includes('ncaa')))
    return ['americanfootball_nfl'];

  if (s.includes('ncaaf') || (s.includes('college') && s.includes('football')))
    return ['americanfootball_ncaaf'];

  if (s.includes('nba') || (s.includes('basketball') && !s.includes('ncaa')))
    return ['basketball_nba'];

  if (s.includes('ncaab') || (s.includes('college') && s.includes('basketball')))
    return ['basketball_ncaab'];

  if (s.includes('mlb') || s.includes('baseball'))
    return ['baseball_mlb'];

  if (s.includes('nhl') || s.includes('hockey'))
    return ['icehockey_nhl'];

  if (s.includes('mma') || s.includes('ufc'))
    return ['mma_mixed_martial_arts'];

  if (s.includes('soccer') || s.includes('mls') || s.includes('football'))
    return [
      'soccer_usa_mls',
      'soccer_epl',
      'soccer_uefa_champs_league',
      'soccer_uefa_europa_league',
    ];

  // Tennis: try all four Grand Slams (ATP + WTA) — whichever is currently
  // active will return data; inactive ones return an empty array quickly.
  if (s.includes('tennis'))
    return [
      'tennis_atp_french_open',
      'tennis_wta_french_open',
      'tennis_atp_wimbledon',
      'tennis_wta_wimbledon',
      'tennis_atp_us_open',
      'tennis_wta_us_open',
      'tennis_atp_australian_open',
      'tennis_wta_australian_open',
    ];

  // Golf: try PGA Tour winner markets plus the four majors
  if (s.includes('golf') || s.includes('pga'))
    return [
      'golf_pga_tour_winner',
      'golf_masters_tournament_winner',
      'golf_pga_championship_winner',
      'golf_us_open_winner',
      'golf_the_open_championship_winner',
    ];

  return [];
}

/**
 * Try The Odds API scores endpoint for a list of sport keys on a given date.
 * Returns on the first key that has completed scores for that date, or
 * { completed: false, scores: null } if none match.
 */
async function checkScoresFromOddsApi(
  sportKeys: string[],
  gameDateIso: string // "YYYY-MM-DD"
): Promise<{ completed: boolean; scores: Record<string, string | number> | null }> {
  const targetDate = gameDateIso.slice(0, 10);

  for (const sportKey of sportKeys) {
    try {
      const url = `${ODDS_API_BASE}/sports/${sportKey}/scores?apiKey=${ODDS_API_KEY}&daysFrom=4`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const events = await res.json() as Array<{
        id: string;
        completed: boolean;
        commence_time: string;
        scores: Array<{ name: string; score: string }> | null;
      }>;

      const relevantCompleted = events.filter(
        (e) =>
          e.completed &&
          e.commence_time.slice(0, 10) === targetDate &&
          e.scores
      );

      if (relevantCompleted.length === 0) continue;

      // Aggregate all scores from matching events into one object for Claude
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
      continue;
    }
  }

  return { completed: false, scores: null };
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
      const sportKeys = bet.sport ? sportToOddsApiKeys(bet.sport) : [];
      const gameDateIso = bet.gameStartTime.toISOString().slice(0, 10);

      let oddsApiScores: Record<string, string | number> | null = null;
      let oddsApiCompleted = false;

      // Try The Odds API first (iterates through all candidate sport keys)
      if (ODDS_API_KEY && sportKeys.length > 0) {
        const result = await checkScoresFromOddsApi(sportKeys, gameDateIso);
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
