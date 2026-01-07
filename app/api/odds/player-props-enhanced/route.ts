import { NextResponse } from 'next/server';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// Sport-specific player prop markets
const SPORT_MARKETS: Record<string, string> = {
  americanfootball_nfl:
    'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds',
  basketball_nba:
    'player_points,player_rebounds,player_assists,player_threes,player_blocks,player_steals',
  baseball_mlb:
    'player_hits,player_total_bases,player_rbis,player_runs_scored,player_strikeouts,player_home_runs',
  icehockey_nhl: 'player_points,player_shots_on_goal,player_assists,player_goals',
};

export async function GET(req: Request) {
  try {
    if (!ODDS_API_KEY) {
      return NextResponse.json(
        { error: 'Odds API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport') || 'americanfootball_nfl';
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const markets = SPORT_MARKETS[sport] || SPORT_MARKETS.americanfootball_nfl;

    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sport}/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${markets}&oddsFormat=american`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch player props');
    }

    const data = await response.json();

    // Transform data to flat list of props with only positive odds
    const props: any[] = [];

    if (data.bookmakers && data.bookmakers.length > 0) {
      const bookmaker = data.bookmakers[0]; // Use first bookmaker (usually DraftKings/FanDuel)

      bookmaker.markets?.forEach((market: any) => {
        market.outcomes?.forEach((outcome: any) => {
          // Only include positive odds (+100 or higher)
          if (outcome.price >= 100) {
            props.push({
              id: `${market.key}_${outcome.description || outcome.name}_${outcome.name}_${outcome.point || 'nopoint'}`.replace(/\s+/g, '_'),
              marketKey: market.key,
              marketName: market.key.replace(/_/g, ' ').toUpperCase(),
              playerName: outcome.description || outcome.name,
              propType: outcome.name, // "Over" or "Under"
              line: outcome.point || null,
              odds: outcome.price,
              description: `${outcome.description || outcome.name} ${outcome.name} ${
                outcome.point || ''
              }`.trim(),
              bookmaker: bookmaker.title,
            });
          }
        });
      });
    }

    return NextResponse.json(props);
  } catch (error) {
    console.error('Error fetching player props:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player props' },
      { status: 500 }
    );
  }
}
