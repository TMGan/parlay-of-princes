/**
 * Admin debug endpoint — returns the raw market keys the Odds API
 * actually sends back for a given event. Delete once done debugging.
 *
 * Usage: /api/admin/debug-props?sport=baseball_mlb&eventId=<id>
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';

const ODDS_API_KEY  = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const MLB_MARKETS = [
  'batter_home_runs','batter_hits','batter_total_bases','batter_rbis',
  'batter_runs_scored','batter_walks','batter_strikeouts','batter_stolen_bases',
  'pitcher_strikeouts','pitcher_hits_allowed','pitcher_earned_runs',
  'pitcher_walks','pitcher_outs',
].join(',');

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const sport   = searchParams.get('sport')   || 'baseball_mlb';
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      // If no eventId, just return the list of upcoming MLB events so you
      // can grab one to test with.
      const eventsRes = await fetch(
        `${ODDS_API_BASE}/sports/${sport}/events?apiKey=${ODDS_API_KEY}`
      );
      const events = await eventsRes.json();
      return NextResponse.json({
        hint: 'Pass ?eventId=<id> to see props for that game',
        events: (events as Array<{ id: string; home_team: string; away_team: string; commence_time: string }>)
          .map((e) => ({ id: e.id, matchup: `${e.away_team} @ ${e.home_team}`, time: e.commence_time })),
      });
    }

    const url =
      `${ODDS_API_BASE}/sports/${sport}/events/${eventId}/odds` +
      `?apiKey=${ODDS_API_KEY}&regions=us&markets=${MLB_MARKETS}&oddsFormat=american`;

    const res  = await fetch(url);
    const data = await res.json() as {
      bookmakers?: Array<{
        title: string;
        markets?: Array<{ key: string; outcomes?: unknown[] }>;
      }>;
    };

    // Return a summary: per-bookmaker list of market keys + outcome count
    const summary = (data.bookmakers ?? []).map((bm) => ({
      bookmaker: bm.title,
      markets: (bm.markets ?? []).map((m) => ({
        key: m.key,
        outcomes: m.outcomes?.length ?? 0,
      })),
    }));

    return NextResponse.json({ sport, eventId, bookmakers: summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
