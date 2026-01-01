import { NextResponse } from "next/server"

const ODDS_API_KEY = process.env.ODDS_API_KEY
const ODDS_API_BASE = "https://api.the-odds-api.com/v4"

export async function GET() {
  try {
    if (!ODDS_API_KEY) {
      return NextResponse.json({ error: "Odds API key not configured" }, { status: 500 })
    }

    const response = await fetch(`${ODDS_API_BASE}/sports?apiKey=${ODDS_API_KEY}`, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      throw new Error("Failed to fetch sports")
    }

    const data = await response.json()

    const supportedSports = data.filter((sport: any) =>
      ["americanfootball_nfl", "basketball_nba", "baseball_mlb", "icehockey_nhl"].includes(sport.key)
    )

    return NextResponse.json(supportedSports)
  } catch (error) {
    console.error("Error fetching sports:", error)
    return NextResponse.json({ error: "Failed to fetch sports" }, { status: 500 })
  }
}
