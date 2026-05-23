import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth/session';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { imageBase64, mediaType } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const resolvedType = validTypes.includes(mediaType) ? mediaType : 'image/jpeg';

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: resolvedType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Parse this sports betting slip image and extract the bet details.

Return ONLY a JSON object with these fields (omit fields you cannot find):
{
  "sport": "sport name (e.g. NFL, NBA, MLB, NHL, Tennis, Golf)",
  "description": "short description of the bet (player name + prop, or team + spread/total)",
  "oddsAmerican": 150,
  "gameStartTime": "2024-01-01T20:00:00.000Z"
}

Rules:
- oddsAmerican must be a positive integer between 100 and 10000 (American format, always positive)
- If odds are shown as negative (e.g. -110) or as decimal (e.g. 1.91), convert to the nearest valid positive American format: use the underdog/longest odds shown, or if it's clearly a favourite line skip it and return null
- description should be concise, max 200 chars
- gameStartTime in ISO 8601 UTC
- Return ONLY the JSON, no markdown, no explanation`,
            },
          ],
        },
      ],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Could not read bet slip — try entering manually' }, { status: 422 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('parse-bet-slip error:', err);
    return NextResponse.json({ error: 'AI parsing failed — try entering manually' }, { status: 500 });
  }
}
