import { NextResponse } from 'next/server';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { handleError } from '@/lib/security/error-handler';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

export async function GET(req: Request) {
  try {
    // Rate limiting: 60 requests per 15 minutes per IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    const rateLimitResult = rateLimit(`odds-games-${ip}`, 60);
    if (!rateLimitResult.success) {
      return createRateLimitResponse('Too many requests. Please slow down.');
    }

    if (!ODDS_API_KEY) {
      return NextResponse.json(
        { error: 'Odds API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport') || 'americanfootball_nfl';

    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }

    const data = await response.json();

    // Simplify the response to just game info
    const games = data.map((event: any) => ({
      id: event.id,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
      sport: sport,
    }));

    return NextResponse.json(games);
  } catch (error) {
    return handleError(error, 'Games');
  }
}
