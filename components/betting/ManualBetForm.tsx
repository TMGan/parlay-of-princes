'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ManualBetFormProps {
  userId: string;
  currentWeek: number;
  canPlaceRegularBet: boolean;
  canPlaceKingLock: boolean;
}

const SPORTS = [
  { key: 'NFL', label: 'NFL' },
  { key: 'NBA', label: 'NBA' },
  { key: 'MLB', label: 'MLB' },
  { key: 'NHL', label: 'NHL' },
];

export function ManualBetForm(props: ManualBetFormProps) {
  const { canPlaceRegularBet, canPlaceKingLock } = props;
  const router = useRouter();

  // Form state
  const [isExpanded, setIsExpanded] = useState(false);
  const [sport, setSport] = useState('');
  const [description, setDescription] = useState('');
  const [odds, setOdds] = useState('');
  const [gameTime, setGameTime] = useState('');
  const [isKingLock, setIsKingLock] = useState(false);

  // Loading & errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validation
      if (!sport || !description || !odds || !gameTime) {
        throw new Error('All fields are required');
      }

      const oddsNumber = parseInt(odds);
      if (isNaN(oddsNumber) || oddsNumber < 100 || oddsNumber > 10000) {
        throw new Error('Odds must be between +100 and +10000');
      }

      if (description.length > 500) {
        throw new Error('Description must be 500 characters or less');
      }

      const gameStartTime = new Date(gameTime);
      if (isNaN(gameStartTime.getTime())) {
        throw new Error('Invalid game time');
      }

      if (gameStartTime < new Date()) {
        throw new Error('Game time must be in the future');
      }

      // Submit bet
      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport,
          description: description.trim(),
          oddsAmerican: oddsNumber,
          gameStartTime: gameStartTime.toISOString(),
          isKingLock,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place bet');
      }

      // Reset form
      setSport('');
      setDescription('');
      setOdds('');
      setGameTime('');
      setIsKingLock(false);
      setIsExpanded(false);

      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (isKingLock ? canPlaceKingLock : canPlaceRegularBet);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full px-4 py-3 bg-background border border-gray-800 rounded-lg hover:border-primary transition-colors text-sm font-medium"
      >
        📝 Enter Bet Manually
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">Manual Entry</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-xs text-gray-400 hover:text-white"
        >
          ✕ Close
        </button>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Sport Dropdown */}
      <div>
        <label htmlFor="sport" className="block text-sm font-medium mb-2">
          Sport *
        </label>
        <select
          id="sport"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          required
        >
          <option value="">Select sport...</option>
          {SPORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Bet Description *
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Patrick Mahomes Over 2.5 TD Passes"
          maxLength={500}
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/500 characters
        </p>
      </div>

      {/* Odds */}
      <div>
        <label htmlFor="odds" className="block text-sm font-medium mb-2">
          Odds (American) *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            +
          </span>
          <input
            id="odds"
            type="number"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            placeholder="150"
            min={100}
            max={10000}
            className="w-full pl-8 pr-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Must be between +100 and +10000
        </p>
      </div>

      {/* Game Time */}
      <div>
        <label htmlFor="gameTime" className="block text-sm font-medium mb-2">
          Game Start Time *
        </label>
        <input
          id="gameTime"
          type="datetime-local"
          value={gameTime}
          onChange={(e) => setGameTime(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          required
        />
      </div>

      {/* King Lock */}
      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="manualKingLock"
          checked={isKingLock}
          onChange={(e) => setIsKingLock(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="manualKingLock" className="text-sm">
          Make this my 👑 <span className="font-bold text-primary">King Lock</span> (2x points)
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="btn-primary w-full disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <Loader2 className="animate-spin mr-2" size={16} />
            Placing Bet...
          </span>
        ) : (
          'Place Bet'
        )}
      </button>

      {!canSubmit && (
        <p className="text-sm text-yellow-500">
          {isKingLock
            ? 'You have already placed your King Lock for this week'
            : 'You have placed all 3 regular bets for this week'}
        </p>
      )}
    </form>
  );
}
