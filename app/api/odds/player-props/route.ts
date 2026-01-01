import { NextResponse } from "next/server"

const ODDS_API_KEY = process.env.ODDS_API_KEY
const ODDS_API_BASE = "https://api.the-odds-api.com/v4"

export async function GET(req: Request) {
  try {
    if (!ODDS_API_KEY) {
      return NextResponse.json({ error: "Odds API key not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const sport = searchParams.get("sport") || "americanfootball_nfl"
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sport}/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds,player_points,player_rebounds,player_assists&oddsFormat=american`,
      {
        next: { revalidate: 300 }
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch player props")
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching player props:", error)
    return NextResponse.json({ error: "Failed to fetch player props" }, { status: 500 })
  }
}
