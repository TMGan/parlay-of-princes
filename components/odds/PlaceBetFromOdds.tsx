"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { formatOdds } from "@/lib/utils/format"

interface PlaceBetFromOddsProps {
  userId: string
  sport: string
  description: string
  odds: number
  gameStartTime: Date
  onClose: () => void
}

export function PlaceBetFromOdds({ userId: _userId, sport, description, odds, gameStartTime, onClose }: PlaceBetFromOddsProps) {
  const router = useRouter()
  const [isKingLock, setIsKingLock] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/bets/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          description,
          oddsAmerican: odds,
          gameStartTime: gameStartTime.toISOString(),
          isKingLock
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to place bet")
      }

      onClose()
      router.refresh()
      router.push("/bets")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Place Bet</h3>
          <button onClick={onClose} className="p-2 hover:bg-background rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="bg-background p-4 rounded space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Sport</span>
              <span className="font-semibold">{sport}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bet</span>
              <span className="font-semibold">{description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Odds</span>
              <span className="font-semibold text-primary">{formatOdds(odds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Game Time</span>
              <span className="font-semibold text-sm">{gameStartTime.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="kingLockOdds"
              checked={isKingLock}
              onChange={(e) => setIsKingLock(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="kingLockOdds" className="text-sm">
              Make this my 👑 <span className="font-bold text-primary">King Lock</span> (2x points)
            </label>
          </div>

          <div className="bg-primary/10 border border-primary p-4 rounded">
            <p className="text-sm text-gray-400 mb-1">Potential Points</p>
            <p className="text-2xl font-bold text-primary">+{isKingLock ? odds * 2 : odds} pts</p>
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-background rounded hover:bg-background-light transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 btn-primary disabled:opacity-50">
              {isLoading ? "Placing..." : "Place Bet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
