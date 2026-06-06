import { NextResponse } from 'next/server';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { handleError } from '@/lib/security/error-handler';
import { getCached, setCached } from '@/lib/cache/odds-cache';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const SPORT_MARKETS: Record<string, string> = {
  americanfootball_nfl: [
    'player_pass_tds',
    'player_pass_yds',
    'player_pass_attempts',
    'player_pass_interceptions',
    'player_rush_yds',
    'player_receptions',
    'player_reception_yds',
    'player_anytime_td',
    'player_kicking_points',
    'player_sacks',
  ].join(','),

  americanfootball_ncaaf: [
    'player_pass_tds',
    'player_pass_yds',
    'player_rush_yds',
    'player_receptions',
    'player_reception_yds',
    'player_anytime_td',
  ].join(','),

  basketball_nba: [
    'player_points',
    'player_rebounds',
    'player_assists',
    'player_threes',
    'player_blocks',
    'player_steals',
    'player_points_rebounds_assists',
    'player_double_double',
    'player_first_basket',
  ].join(','),

  basketball_ncaab: [
    'player_points',
    'player_rebounds',
    'player_assists',
    'player_threes',
  ].join(','),

  baseball_mlb: [
    'player_hits',
    'player_total_bases',
    'player_rbis',
    'player_runs_scored',
    'player_strikeouts',
    'player_home_runs',
    'player_hits_allowed',
    'player_earned_runs',
    'player_walks',
  ].join(','),

  icehockey_nhl: [
    'player_points',
    'player_shots_on_goal',
    'player_assists',
    'player_goals',
    'player_saves',
    'player_power_play_points',
    'player_first_goal_scorer',
  ].join(','),

  soccer_usa_mls: [
    'player_to_score',
    'player_first_to_score',
    'player_shots_on_target',
  ].join(','),

  mma_mixed_martial_arts: 'h2h',
  boxing_boxing:          'h2h',
  motorsport_nascar_cup_series: 'h2h',

  golf_pga_tour: [
    'golfer_win_tournament',
    'golfer_top_5_finish',
    'golfer_top_10_finish',
    'golfer_top_20_finish',
    'golfer_make_cut',
  ].join(','),
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
  // NFL / NCAAF
  player_pass_tds:           'Pass TDs',
  player_pass_yds:           'Pass Yards',
  player_pass_attempts:      'Pass Attempts',
  player_pass_interceptions: 'Interceptions',
  player_rush_yds:           'Rush Yards',
  player_receptions:         'Receptions',
  player_reception_yds:      'Rec. Yards',
  player_anytime_td:         'Anytime TD',
  player_kicking_points:     'Kicking Points',
  player_sacks:              'Sacks',

  // NBA / NCAAB
  player_points:                  'Points',
  player_rebounds:                'Rebounds',
  player_assists:                 'Assists',
  player_threes:                  '3-Pointers',
  player_blocks:                  'Blocks',
  player_steals:                  'Steals',
  player_points_rebounds_assists: 'Pts+Reb+Ast',
  player_double_double:           'Double-Double',
  player_first_basket:            'First Basket',

  // MLB
  player_hits:          'Hits',
  player_total_bases:   'Total Bases',
  player_rbis:          'RBIs',
  player_runs_scored:   'Runs Scored',
  player_strikeouts:    'Strikeouts',
  player_home_runs:     'Home Runs',
  player_hits_allowed:  'Hits Allowed',
  player_earned_runs:   'Earned Runs',
  player_walks:         'Walks',

  // NHL
  player_goals:              'Goals',
  player_shots_on_goal:      'Shots on Goal',
  player_saves:              'Saves',
  player_power_play_points:  'Power Play Pts',
  player_first_goal_scorer:  'First Goal Scorer',

  // Soccer
  player_to_score:        'Anytime Goalscorer',
  player_first_to_score:  'First Goalscorer',
  player_shots_on_target: 'Shots on Target',

  // Golf
  golfer_win_tournament:  'Win Tournament',
  golfer_top_5_finish:    'Top 5 Finish',
  golfer_top_10_finish:   'Top 10 Finish',
  golfer_top_20_finish:   'Top 20 Finish',
  golfer_make_cut:        'Make the Cut',
};

function marketLabel(key: string): string {
  return MARKET_LABELS[key] ?? key.replace(/^player_/, '').replace(/_/g, ' ');
}

function extractProps(bookmaker: Bookmaker): PlayerProp[] {
  const props: PlayerProp[] = [];
  bookmaker.markets?.forEach((market) => {
    const statName = marketLabel(market.key);
    market.outcomes?.forEach((outcome) => {
      if (outcome.price < 100) return;

      // Over/Under markets have description = player name, name = "Over"/"Under".
      // Yes/No and scorer markets (anytime TD, first basket, goalscorer) have no
      // description — the player name is outcome.name itself.
      const hasPlayerDescription = outcome.description != null && outcome.description !== '';
      const playerName = hasPlayerDescription ? outcome.description! : outcome.name;
      const propType   = hasPlayerDescription ? outcome.name : null; // "Over"/"Under"/"Yes"/"No" or absent
      const linePart   = outcome.point != null ? ` ${outcome.point}` : '';

      // Build a clean description:
      //   Over/Under: "Patrick Mahomes Over 299.5 Pass Yards"
      //   Scorer/Yes-No: "Patrick Mahomes — Anytime TD"
      const description = propType
        ? `${playerName} ${propType}${linePart} ${statName}`
        : `${playerName} — ${statName}`;

      props.push({
        id: `${market.key}_${playerName}_${propType ?? 'pick'}_${outcome.point ?? 'nopoint'}`.replace(/\s+/g, '_'),
        marketKey:  market.key,
        marketName: statName,
        playerName,
        propType:   propType ?? statName,
        line:       outcome.point ?? null,
        odds:       outcome.price,
        description,
        bookmaker:  bookmaker.title,
      });
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
