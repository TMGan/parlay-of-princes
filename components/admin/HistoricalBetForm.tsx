'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getWeekNumber } from '@/lib/utils/format';

interface User {
  id: string;
  username: string;
  email: string;
}

interface HistoricalBetFormProps {
  users: User[];
}

const SPORTS = [
  { key: 'NFL', label: 'NFL' },
  { key: 'NBA', label: 'NBA' },
  { key: 'MLB', label: 'MLB' },
  { key: 'NHL', label: 'NHL' },
];

export function HistoricalBetForm({ users }: HistoricalBetFormProps) {
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [sport, setSport] = useState('');
  const [description, setDescription] = useState('');
  const [odds, setOdds] = useState('');
  const [gameTime, setGameTime] = useState('');
  const [isKingLock, setIsKingLock] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentWeek = getWeekNumber(new Date());
  const minWeek = Math.max(1, currentWeek - 26);
  const maxWeek = currentWeek - 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!userId || !weekNumber || !sport || !description || !odds || !gameTime) {
        throw new Error('All fields are required');
      }

      const weekNum = parseInt(weekNumber, 10);
      if (isNaN(weekNum) || weekNum < minWeek || weekNum > maxWeek) {
        throw new Error(`Week must be between ${minWeek} and ${maxWeek}`);
      }

      const oddsNumber = parseInt(odds, 10);
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

      const response = await fetch('/api/admin/historical-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          weekNumber: weekNum,
          sport,
          description: description.trim(),
          oddsAmerican: oddsNumber,
          gameStartTime: gameStartTime.toISOString(),
          isKingLock,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add historical bet');
      }

      setUserId('');
      setWeekNumber('');
      setSport('');
      setDescription('');
      setOdds('');
      setGameTime('');
      setIsKingLock(false);
      setSuccess('Historical bet added successfully! You can now resolve it in the bets list above.');

      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium mb-2">
            User *
          </label>
          <select
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
            required
          >
            <option value="">Select user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="weekNumber" className="block text-sm font-medium mb-2">
            Week Number *
          </label>
          <select
            id="weekNumber"
            value={weekNumber}
            onChange={(e) => setWeekNumber(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
            required
          >
            <option value="">Select week...</option>
            {Array.from({ length: maxWeek - minWeek + 1 }, (_, i) => maxWeek - i).map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Current week is {currentWeek}. Can add for weeks {minWeek}-{maxWeek}.
          </p>
        </div>

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
        </div>
      </div>

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

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="historicalKingLock"
          checked={isKingLock}
          onChange={(e) => setIsKingLock(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="historicalKingLock" className="text-sm">
          This was their 👑 <span className="font-bold text-primary">King Lock</span> (2x points when resolved)
        </label>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <p className="text-sm text-gray-400">
          Bet will be added as <span className="text-yellow-500 font-semibold">PENDING</span>. Resolve it above.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 px-8"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin mr-2" size={16} />
              Adding...
            </span>
          ) : (
            'Add Historical Bet'
          )}
        </button>
      </div>
    </form>
  );
}
