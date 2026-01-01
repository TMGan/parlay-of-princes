/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { formatOdds } from "@/lib/utils/format"
import { PlaceBetFromOdds } from "./PlaceBetFromOdds"

interface EventCardProps {
  event: any
  sport: string
  userId: string
}

export function EventCard({ event, sport, userId }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedProp, setSelectedProp] = useState<any>(null)

  const startTime = new Date(event.commence_time)
  const homeTeam = event.home_team
  const awayTeam = event.away_team

  const bookmaker = event.bookmakers?.[0]
  const markets = bookmaker?.markets || []

  const spreadMarket = markets.find((m: any) => m.key === "spreads")
  const totalsMarket = markets.find((m: any) => m.key === "totals")

  const homeSpread = spreadMarket?.outcomes?.find((o: any) => o.name === homeTeam)
  const awaySpread = spreadMarket?.outcomes?.find((o: any) => o.name === awayTeam)
  const overTotal = totalsMarket?.outcomes?.find((o: any) => o.name === "Over")
  const underTotal = totalsMarket?.outcomes?.find((o: any) => o.name === "Under")

  const handleSelectProp = (description: string, odds: number) => {
    if (odds < 100) {
      alert("Only positive odds (+100 or higher) are allowed")
      return
    }

    setSelectedProp({
      description,
      odds,
      gameStartTime: startTime
    })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded">
              {sport === "americanfootball_nfl" ? "NFL" : sport === "basketball_nba" ? "NBA" : sport === "baseball_mlb" ? "MLB" : "NHL"}
            </span>
            <span className="text-sm text-gray-400">
              {startTime.toLocaleDateString()} • {startTime.toLocaleTimeString()}
            </span>
          </div>
          <h3 className="text-xl font-bold">
            {awayTeam} @ {homeTeam}
          </h3>
          {bookmaker && <p className="text-sm text-gray-400 mt-1">Odds from {bookmaker.title}</p>}
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-background rounded transition-colors">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {!isExpanded && markets.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {homeSpread && (
            <div className="bg-background p-3 rounded">
              <p className="text-xs text-gray-400 mb-1">Home Spread</p>
              <p className="font-semibold">
                {homeTeam} {homeSpread.point > 0 ? "+" : ""}
                {homeSpread.point}
              </p>
              <p className="text-sm text-primary">{formatOdds(homeSpread.price)}</p>
            </div>
          )}
          {overTotal && (
            <div className="bg-background p-3 rounded">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="font-semibold">Over {overTotal.point}</p>
              <p className="text-sm text-primary">{formatOdds(overTotal.price)}</p>
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-6 mt-6">
          {spreadMarket && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">SPREADS</h4>
              <div className="grid grid-cols-2 gap-4">
                {homeSpread && homeSpread.price >= 100 && (
                  <button
                    onClick={() =>
                      handleSelectProp(`${homeTeam} ${homeSpread.point > 0 ? "+" : ""}${homeSpread.point}`, homeSpread.price)
                    }
                    className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1">
                      {homeTeam} {homeSpread.point > 0 ? "+" : ""}
                      {homeSpread.point}
                    </p>
                    <p className="text-lg text-primary font-bold">{formatOdds(homeSpread.price)}</p>
                  </button>
                )}
                {awaySpread && awaySpread.price >= 100 && (
                  <button
                    onClick={() =>
                      handleSelectProp(`${awayTeam} ${awaySpread.point > 0 ? "+" : ""}${awaySpread.point}`, awaySpread.price)
                    }
                    className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1">
                      {awayTeam} {awaySpread.point > 0 ? "+" : ""}
                      {awaySpread.point}
                    </p>
                    <p className="text-lg text-primary font-bold">{formatOdds(awaySpread.price)}</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {totalsMarket && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">TOTALS</h4>
              <div className="grid grid-cols-2 gap-4">
                {overTotal && overTotal.price >= 100 && (
                  <button
                    onClick={() => handleSelectProp(`Over ${overTotal.point}`, overTotal.price)}
                    className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1">Over {overTotal.point}</p>
                    <p className="text-lg text-primary font-bold">{formatOdds(overTotal.price)}</p>
                  </button>
                )}
                {underTotal && underTotal.price >= 100 && (
                  <button
                    onClick={() => handleSelectProp(`Under ${underTotal.point}`, underTotal.price)}
                    className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1">Under {underTotal.point}</p>
                    <p className="text-lg text-primary font-bold">{formatOdds(underTotal.price)}</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {markets.length === 0 && <p className="text-gray-400 text-center py-4">No odds available for this game yet.</p>}
        </div>
      )}

      {selectedProp && (
        <PlaceBetFromOdds
          userId={userId}
          sport={sport === "americanfootball_nfl" ? "NFL" : sport === "basketball_nba" ? "NBA" : sport === "baseball_mlb" ? "MLB" : "NHL"}
          description={selectedProp.description}
          odds={selectedProp.odds}
          gameStartTime={selectedProp.gameStartTime}
          onClose={() => setSelectedProp(null)}
        />
      )}
    </div>
  )
}
