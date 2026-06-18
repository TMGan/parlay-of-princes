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

    // Golf (winner key), NASCAR, MMA, Boxing use h2h only; everything else includes spreads + totals.
    const isMatchupOnly =
      sport === "golf_pga_tour_winner" ||
      sport === "motorsport_nascar_cup_series" ||
      sport === "mma_mixed_martial_arts" ||
      sport === "boxing_boxing"
    const markets = isMatchupOnly ? "h2h" : "h2h,spreads,totals"

    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${markets}&oddsFormat=american`,
      {
        next: { revalidate: 300 }
      }
    )

    // Non-OK means no active events for this sport — return empty so the UI
    // shows "No Games Available" instead of an error banner.
    if (!response.ok) {
      return NextResponse.json([])
    }

    const data = await response.json()

    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json([])
  }
}
