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

function extractProps(bookmaker: Bookmaker): PlayerProp[] {
  const props: PlayerProp[] = [];
  bookmaker.markets?.forEach((market) => {
    market.outcomes?.forEach((outcome) => {
      if (outcome.price >= 100) {
        props.push({
          id: `${market.key}_${outcome.description ?? outcome.name}_${outcome.name}_${outcome.point ?? 'nopoint'}`.replace(/\s+/g, '_'),
          marketKey: market.key,
          marketName: market.key.replace(/_/g, ' ').toUpperCase(),
          playerName: outcome.description ?? outcome.name,
          propType: outcome.name,
          line: outcome.point ?? null,
          odds: outcome.price,
          description: `${outcome.description ?? outcome.name} ${outcome.name} ${outcome.point ?? ''}`.trim(),
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
