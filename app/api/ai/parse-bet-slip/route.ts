import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth/session';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { handleError } from '@/lib/security/error-handler';

const client = new Anthropic();

const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ValidMediaType = (typeof VALID_MEDIA_TYPES)[number];

// Keep the prompt as a module-level constant so it's easy to iterate on.
const PARSE_PROMPT = `You are reading a sports betting slip image. Extract the single most relevant bet and return ONLY a JSON object — no markdown, no explanation.

Required fields:
{
  "sport": "NFL" | "NBA" | "MLB" | "NHL" | "Tennis" | "Golf" | "MMA" | "Horse Racing" | "Soccer" | or another short sport name,
  "description": "concise bet description, max 150 chars",
  "oddsAmerican": 150,
  "gameStartTime": "YYYY-MM-DDTHH:MM"
}

Field rules:

sport:
  - Detect from context (team names, player names, race track, etc.)
  - Use "Horse Racing" for any racing bet slip

description:
  - For player props: "Player Name Stat Over/Under Line" — e.g. "Cole Caufield First Goalscorer"
  - For team bets: "Team A vs Team B — spread/total/moneyline"
  - For horse racing: "Horse Name to Win/Place/Show, Race N at Track"
  - For parlays: pick the single highest-odds leg and note "(parlay leg)" at the end

oddsAmerican:
  - Must be a POSITIVE integer between 100 and 10000
  - If shown as positive American (e.g. +1200) → use 1200
  - If shown as negative American (e.g. -110) → find the underdog/other side's odds, or return null
  - If shown as decimal (e.g. 2.50) → convert: (decimal - 1) × 100 → 150; if result < 100 return null
  - If multiple odds shown → pick the highest (most favorable to the bettor)
  - If no valid positive odds found → omit the field

gameStartTime:
  - Return as "YYYY-MM-DDTHH:MM" in Eastern Time (ET), exactly as the event is scheduled
  - Use context clues: day-of-week labels, venue, sport schedule norms
  - If only a date is visible (no time), use "YYYY-MM-DDT20:00" as a sensible default
  - If no date is visible at all, omit the field
  - Do NOT convert to UTC — return the ET wall-clock time

Omit any field you cannot determine with reasonable confidence.`;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate-limit: 10 parses per 15 min per user (Anthropic calls cost money)
    const rl = rateLimit(`parse-slip-${user.id}`, 10);
    if (!rl.success) return createRateLimitResponse('Too many bet slip scans. Try again in 15 minutes.');

    const { imageBase64, mediaType } = (await req.json()) as {
      imageBase64?: string;
      mediaType?: string;
    };

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const resolvedType: ValidMediaType = VALID_MEDIA_TYPES.includes(mediaType as ValidMediaType)
      ? (mediaType as ValidMediaType)
      : 'image/jpeg';

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: resolvedType, data: imageBase64 },
            },
            { type: 'text', text: PARSE_PROMPT },
          ],
        },
      ],
    });

    const rawText = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';

    // Strip markdown code fences if the model wraps the JSON anyway
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Could not read the bet slip — try entering the details manually.' },
        { status: 422 }
      );
    }

    // Sanitise fields before returning
    const result: Record<string, unknown> = {};
    if (typeof parsed.sport === 'string') result.sport = parsed.sport.slice(0, 50);
    if (typeof parsed.description === 'string') result.description = parsed.description.slice(0, 200);
    if (typeof parsed.oddsAmerican === 'number' && parsed.oddsAmerican >= 100 && parsed.oddsAmerican <= 10000) {
      result.oddsAmerican = Math.round(parsed.oddsAmerican);
    }
    // gameStartTime is "YYYY-MM-DDTHH:MM" — validate the shape before passing through
    if (typeof parsed.gameStartTime === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(parsed.gameStartTime)) {
      result.gameStartTime = parsed.gameStartTime;
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, 'Parse Bet Slip');
  }
}
