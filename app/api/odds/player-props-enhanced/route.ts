import { NextResponse } from 'next/server';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { handleError } from '@/lib/security/error-handler';
import { getCached, setCached } from '@/lib/cache/odds-cache';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const SPORT_MARKETS: Record<string, string> = {
  americanfootball_nfl:
    'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds',
  basketball_nba:
    'player_points,player_rebounds,player_assists,player_threes,player_blocks,player_steals',
  baseball_mlb:
    'player_hits,player_total_bases,player_rbis,player_runs_scored,player_strikeouts,player_home_runs',
  icehockey_nhl: 'player_points,player_shots_on_goal,player_assists,player_goals',
  mma_mixed_martial_arts: 'h2h',
  boxing_boxing: 'h2h',
  golf_pga_tour: 'golfer_win_tournament,golfer_top_5_finish,golfer_top_10_finish',
};

interface Outcome {
  name: string;
  description?: string;
  price: number;
  point?: number;
}

interface Market {
  key: string;
  outcomes?: Outcome[];
}

interface Bookmaker {
  title: string;
  markets?: Market[];
}

interface OddsData {
  bookmakers?: Bookmaker[];
}

interface PlayerProp {
  id: string;
  marketKey: string;
  marketName: string;
  playerName: string;
  propType: string;
  line: number | null;
  odds: number;
  description: string;
  bookmaker: string;
}

/** Human-readable labels for each market key. */
const MARKET_LABELS: Record<string, string> = {
  player_goals: 'Goals',
  player_assists: 'Assists',
  player_points: 'Points',
  player_shots_on_goal: 'Shots on Goal',
  player_pass_tds: 'Pass TDs',
  player_pass_yds: 'Pass Yards',
  player_rush_yds: 'Rush Yards',
  player_receptions: 'Receptions',
  player_reception_yds: 'Rec. Yards',
  player_hits: 'Hits',
  player_total_bases: 'Total Bases',
  player_rbis: 'RBIs',
  player_runs_scored: 'Runs Scored',
  player_strikeouts: 'Strikeouts',
  player_home_runs: 'Home Runs',
  player_rebounds: 'Rebounds',
  player_blocks: 'Blocks',
  player_steals: 'Steals',
  player_threes: '3-Pointers',
};

function marketLabel(key: string): string {
  return MARKET_LABELS[key] ?? key.replace(/^player_/, '').replace(/_/g, ' ');
}

function extractProps(bookmaker: Bookmaker): PlayerProp[] {
  const props: PlayerProp[] = [];
  bookmaker.markets?.forEach((market) => {
    const statName = marketLabel(market.key);
    market.outcomes?.forEach((outcome) => {
      if (outcome.price >= 100) {
        const playerName = outcome.description ?? outcome.name;
        const propType = outcome.name; // "Over" | "Under"
        const linePart = outcome.point != null ? ` ${outcome.point}` : '';
        // e.g. "Mark Stone Over 0.5 Goals"
        const description = `${playerName} ${propType}${linePart} ${statName}`;
        props.push({
          id: `${market.key}_${playerName}_${propType}_${outcome.point ?? 'nopoint'}`.replace(/\s+/g, '_'),
          marketKey: market.key,
          marketName: statName,
          playerName,
          propType,
          line: outcome.point ?? null,
          odds: outcome.price,
          description,
          bookmaker: bookmaker.title,
        });
      }
    });
  });
  return props;
}

export async function GET(req: Request) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    const rateLimitResult = rateLimit(`odds-props-${ip}`, 60);
    if (!rateLimitResult.success) {
      return createRateLimitResponse('Too many requests. Please slow down.');
    }

    if (!ODDS_API_KEY) {
      return NextResponse.json({ error: 'Odds API key not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport') || 'americanfootball_nfl';
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Return cached response if fresh
    const cacheKey = `props:${sport}:${eventId}`;
    const cached = getCached<PlayerProp[]>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const markets = SPORT_MARKETS[sport] ?? SPORT_MARKETS['americanfootball_nfl'];

    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sport}/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${markets}&oddsFormat=american`
    );

    if (response.status === 401 || response.status === 422) {
      return NextResponse.json(
        { error: 'Odds API quota exceeded. Try again tomorrow.' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      throw new Error(`Odds API error: ${response.status}`);
    }

    const data = (await response.json()) as OddsData;

    // Try each bookmaker in order until we find one with props
    let props: PlayerProp[] = [];
    for (const bookmaker of data.bookmakers ?? []) {
      props = extractProps(bookmaker);
      if (props.length > 0) break;
    }

    setCached(cacheKey, props);
    return NextResponse.json(props);
  } catch (error) {
    return handleError(error, 'Player Props');
  }
}
