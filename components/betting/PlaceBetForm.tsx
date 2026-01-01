'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlaceBetFormProps {
  userId: string;
  currentWeek: number;
  canPlaceRegularBet: boolean;
  canPlaceKingLock: boolean;
}

export function PlaceBetForm({
  userId,
  currentWeek,
  canPlaceRegularBet,
  canPlaceKingLock
}: PlaceBetFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    sport: "NFL",
    description: "",
    odds: "",
    gameStartTime: "",
    isKingLock: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const odds = parseInt(formData.odds);

      if (odds < 100) {
        throw new Error("Odds must be +100 or higher (no negative odds allowed)");
      }

      const response = await fetch("/api/bets/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: formData.sport,
          description: formData.description,
          oddsAmerican: odds,
          gameStartTime: new Date(formData.gameStartTime).toISOString(),
          isKingLock: formData.isKingLock,
          userId,
          weekNumber: currentWeek
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to place bet");
      }

      // Reset form
      setFormData({
        sport: "NFL",
        description: "",
        odds: "",
        gameStartTime: "",
        isKingLock: false
      });

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = formData.isKingLock ? canPlaceKingLock : canPlaceRegularBet;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {!canSubmit && (
        <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-4 py-3 rounded text-sm">
          {formData.isKingLock
            ? "You have already placed your King Lock for this week"
            : "You have placed all 3 regular bets for this week"}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Sport</label>
        <select
          value={formData.sport}
          onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
          className="input w-full"
          required
        >
          <option value="NFL">NFL</option>
          <option value="NBA">NBA</option>
          <option value="MLB">MLB</option>
          <option value="NHL">NHL</option>
          <option value="NCAAF">NCAAF</option>
          <option value="NCAAB">NCAAB</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bet Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input w-full"
          placeholder="Patrick Mahomes Over 2.5 TD Passes"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Odds (American, +100 or higher)</label>
        <input
          type="number"
          value={formData.odds}
          onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
          className="input w-full"
          placeholder="150"
          min="100"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Enter odds as a positive number (e.g., 150 for +150)</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Game Start Time</label>
        <input
          type="datetime-local"
          value={formData.gameStartTime}
          onChange={(e) => setFormData({ ...formData, gameStartTime: e.target.value })}
          className="input w-full"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="kingLock"
          checked={formData.isKingLock}
          onChange={(e) => setFormData({ ...formData, isKingLock: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="kingLock" className="text-sm">
          Make this my 👑 <span className="font-bold text-primary">King Lock</span> (2x points)
        </label>
      </div>

      <button type="submit" disabled={isLoading || !canSubmit} className="btn-primary w-full disabled:opacity-50">
        {isLoading ? "Placing Bet..." : "Place Bet"}
      </button>
    </form>
  );
}
