import { NextResponse } from "next/server";

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

interface ApiSport {
  key: string;
  title: string;
  description?: string;
  active?: boolean;
}

export async function GET() {
  try {
    if (!ODDS_API_KEY) {
      return NextResponse.json({ error: "Odds API key not configured" }, { status: 500 });
    }

    const response = await fetch(`${ODDS_API_BASE}/sports?apiKey=${ODDS_API_KEY}`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sports");
    }

    const data = (await response.json()) as ApiSport[];

    // Temporarily return all active soccer sports so we can identify the World Cup key.
    // Revert this filter after confirming the correct key.
    const supportedSports = data.filter((sport: ApiSport) =>
      sport.active && sport.key.startsWith("soccer_")
    );

    return NextResponse.json(supportedSports);
  } catch (error) {
    console.error("Error fetching sports:", error);
    return NextResponse.json({ error: "Failed to fetch sports" }, { status: 500 });
  }
}
