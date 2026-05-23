'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Crown } from 'lucide-react';

const SPORT_OPTIONS = [
  'MLB', 'NFL', 'NBA', 'NHL', 'MLS', 'Golf', 'UFC / MMA', 'Tennis', 'College Football', 'College Basketball', 'Other',
];

export function BonusBetForm() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState('');
  const [oddsAmerican, setOddsAmerican] = useState('');

  // Split date + time pickers
  const [gameDate, setGameDate] = useState('');
  const [gameTime, setGameTime] = useState('20:00');
  const [availDate, setAvailDate] = useState('');
  const [availTime, setAvailTime] = useState('08:00');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('18:00');

  const resetForm = () => {
    setName(''); setDescription(''); setSport(''); setOddsAmerican('');
    setGameDate(''); setGameTime('20:00');
    setAvailDate(''); setAvailTime('08:00');
    setExpiryDate(''); setExpiryTime('18:00');
  };

  const combine = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/bonus-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          sport,
          oddsAmerican: Number(oddsAmerican),
          gameStartTime: combine(gameDate, gameTime),
          availableDate: combine(availDate, availTime),
          expiryDate: combine(expiryDate, expiryTime),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create bonus pick');

      resetForm();
      setIsExpanded(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <button onClick={() => setIsExpanded(true)} className="btn-primary">
        + Create Bonus Pick
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="text-secondary" size={20} />
          <h3 className="text-lg font-bold">New Bonus Pick</h3>
        </div>
        <button
          type="button"
          onClick={() => { setIsExpanded(false); resetForm(); }}
          className="text-sm text-gray-400 hover:text-white"
        >
          ✕ Cancel
        </button>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Theme + Sport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Pick Theme / Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dinger Tuesday, Monday Night Special"
            maxLength={100}
            required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">This is the headline everyone sees</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sport / Category *</label>
          <div className="flex gap-2">
            <select
              value={SPORT_OPTIONS.includes(sport) ? sport : ''}
              onChange={(e) => setSport(e.target.value)}
              className="flex-1 px-3 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-sm"
            >
              <option value="">Select sport…</option>
              {SPORT_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="text"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              placeholder="or type custom"
              maxLength={50}
              className="flex-1 px-3 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">What are users betting on? *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Will any player hit a home run tonight? Pick YES or NO."
          maxLength={500}
          rows={2}
          required
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none resize-none"
        />
      </div>

      {/* Odds */}
      <div className="max-w-xs">
        <label className="block text-sm font-medium mb-1">Odds *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+</span>
          <input
            type="number"
            value={oddsAmerican}
            onChange={(e) => setOddsAmerican(e.target.value)}
            placeholder="150"
            min={100}
            max={10000}
            required
            className="w-full pl-8 pr-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Date/Time pickers */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-300">Schedule</p>

        <div>
          <label className="block text-sm font-medium mb-1">Game Starts *</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              required
              className="px-3 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-sm"
            />
            <input
              type="time"
              value={gameTime}
              onChange={(e) => setGameTime(e.target.value)}
              required
              className="px-3 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Available From *</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={availDate}
              onChange={(e) => setAvailDate(e.target.value)}
              required
              className="px-3 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-sm"
            />
            <input
              type="time"
              value={availTime}
              onChange={(e) => setAvailTime(e.target.value)}
              required
              className="px-3 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expires At (last chance to claim) *</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="px-3 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-sm"
            />
            <input
              type="time"
              value={expiryTime}
              onChange={(e) => setExpiryTime(e.target.value)}
              required
              className="px-3 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-sm"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Set this before game start so users can&apos;t claim after it kicks off
          </p>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Creating...
          </span>
        ) : (
          '🎯 Create & Notify Users'
        )}
      </button>
    </form>
  );
}
