import { NextResponse } from 'next/server';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { handleError } from '@/lib/security/error-handler';
import { getCached, setCached } from '@/lib/cache/odds-cache';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

interface ApiEvent {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
}

interface SimplifiedGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sport: string;
}

export async function GET(req: Request) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    const rateLimitResult = rateLimit(`odds-games-${ip}`, 60);
    if (!rateLimitResult.success) {
      return createRateLimitResponse('Too many requests. Please slow down.');
    }

    if (!ODDS_API_KEY) {
      return NextResponse.json({ error: 'Odds API key not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport') || 'americanfootball_nfl';

    // Return cached response if fresh — avoids burning API quota on repeated calls
    const cacheKey = `games:${sport}`;
    const cached = getCached<SimplifiedGame[]>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american`
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

    const data = (await response.json()) as ApiEvent[];

    const games: SimplifiedGame[] = data.map((event) => ({
      id: event.id,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
      sport,
    }));

    setCached(cacheKey, games);
    return NextResponse.json(games);
  } catch (error) {
    return handleError(error, 'Games');
  }
}
