"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { formatOdds, formatDateTimeET } from "@/lib/utils/format"

interface PlaceBetFromOddsProps {
  userId: string
  sport: string
  description: string
  odds: number
  gameStartTime: Date
  onClose: () => void
}

interface ActiveBonusBet {
  id: string
  name: string
  description: string
  sport: string
  claimed: boolean
}

export function PlaceBetFromOdds({ sport, description, odds, gameStartTime, onClose }: PlaceBetFromOddsProps) {
  const router = useRouter()
  const [isKingLock, setIsKingLock] = useState(false)
  const [isBonusBet, setIsBonusBet] = useState(false)
  const [activeBonusBet, setActiveBonusBet] = useState<ActiveBonusBet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/bonus-bets/active")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.claimed) setActiveBonusBet(data)
      })
      .catch(() => {})
  }, [])

  const handleKingLockChange = (checked: boolean) => {
    setIsKingLock(checked)
    if (checked) setIsBonusBet(false)
  }

  const handleBonusChange = (checked: boolean) => {
    setIsBonusBet(checked)
    if (checked) setIsKingLock(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const endpoint = isBonusBet ? "/api/bets/place-bonus" : "/api/bets/place"
      const body = isBonusBet
        ? {
            bonusBetId: activeBonusBet!.id,
            description,
            oddsAmerican: odds,
            gameStartTime: gameStartTime.toISOString(),
          }
        : {
            sport,
            description,
            oddsAmerican: odds,
            gameStartTime: gameStartTime.toISOString(),
            isKingLock,
          }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to place bet")
      }

      onClose()
      router.refresh()
      router.push("/bets")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bet")
    } finally {
      setIsLoading(false)
    }
  }

  const effectivePoints = isBonusBet ? odds : isKingLock ? odds * 2 : odds

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
              <span className="font-semibold text-right max-w-[60%]">{description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Odds</span>
              <span className="font-semibold text-primary">{formatOdds(odds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Game Time</span>
              <span className="font-semibold text-sm">{formatDateTimeET(gameStartTime)}</span>
            </div>
          </div>

          {/* King Lock */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="kingLockOdds"
              checked={isKingLock}
              onChange={(e) => handleKingLockChange(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="kingLockOdds" className="text-sm">
              Make this my 👑 <span className="font-bold text-primary">King Lock</span> (2x points)
            </label>
          </div>

          {/* Bonus Pick — only shown if there's an active unclaimed bonus bet */}
          {activeBonusBet && (
            <div className="flex items-start space-x-2 p-3 rounded-xl border border-secondary/30 bg-secondary/5">
              <input
                type="checkbox"
                id="bonusBetOdds"
                checked={isBonusBet}
                onChange={(e) => handleBonusChange(e.target.checked)}
                className="w-4 h-4 mt-0.5"
              />
              <label htmlFor="bonusBetOdds" className="text-sm cursor-pointer">
                Use as 🎯 <span className="font-bold text-secondary">Bonus Pick</span>
                <span className="block text-xs text-gray-400 mt-0.5">{activeBonusBet.name}</span>
              </label>
            </div>
          )}

          <div className="bg-primary/10 border border-primary p-4 rounded">
            <p className="text-sm text-gray-400 mb-1">Potential Points</p>
            <p className="text-2xl font-bold text-primary">+{effectivePoints} pts</p>
            {isKingLock && <p className="text-xs text-gray-400 mt-1">King Lock 2× multiplier applied</p>}
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
