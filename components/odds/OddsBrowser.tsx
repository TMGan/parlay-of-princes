/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { EventCard } from "./EventCard"

interface OddsBrowserProps {
  userId: string
}

export function OddsBrowser({ userId }: OddsBrowserProps) {
  const [selectedSport, setSelectedSport] = useState("americanfootball_nfl")
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const sports = [
    { key: "americanfootball_nfl", label: "NFL" },
    { key: "basketball_nba", label: "NBA" },
    { key: "baseball_mlb", label: "MLB" },
    { key: "icehockey_nhl", label: "NHL" }
  ]

  useEffect(() => {
    fetchEvents()
  }, [selectedSport])

  const fetchEvents = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/odds/events?sport=${selectedSport}`)

      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }

      const data = await response.json()
      setEvents(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        {sports.map((sport) => (
          <button
            key={sport.key}
            onClick={() => setSelectedSport(sport.key)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              selectedSport === sport.key ? "bg-primary text-white" : "bg-background-light text-gray-400 hover:text-white"
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="card bg-accent/10 border-accent">
          <p className="text-accent">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      )}

      {!isLoading && !error && (
        <>
          {events.length === 0 ? (
            <div className="card text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No Games Available</h3>
              <p className="text-gray-400">Check back later for upcoming games and odds.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} sport={selectedSport} userId={userId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
