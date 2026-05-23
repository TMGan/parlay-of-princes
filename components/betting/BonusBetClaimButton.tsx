'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'VOIDED';

const STATUS_STYLES: Record<BetStatus, string> = {
  WON:    'text-green-400 bg-green-500/10 border-green-500/30',
  LOST:   'text-red-400 bg-red-500/10 border-red-500/30',
  VOIDED: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  PENDING:'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
};

const STATUS_LABELS: Record<BetStatus, string> = {
  WON: '✅ Won!',
  LOST: '❌ Lost',
  VOIDED: '↩️ Voided',
  PENDING: '⏳ Pending result',
};

interface Props {
  bonusBetId: string;
  sport: string;
  claimed: boolean;
  claimedBet: { status: BetStatus; description: string } | null;
  leagueId: string | undefined;
}

export function BonusBetClaimButton({ bonusBetId, sport, claimed, claimedBet, leagueId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'form' | 'done'>('idle');
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState('');

  // User's pick fields
  const [description, setDescription] = useState('');
  const [odds, setOdds] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameTime, setGameTime] = useState('20:00');

  const handleClaim = async () => {
    if (!description.trim() || !odds || !gameDate) {
      setError('All fields are required');
      return;
    }
    const oddsNum = Number(odds);
    if (isNaN(oddsNum) || oddsNum < 100 || oddsNum > 10000) {
      setError('Odds must be between +100 and +10000');
      return;
    }

    setIsClaiming(true);
    setError('');

    try {
      const res = await fetch('/api/bets/place-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bonusBetId,
          description: description.trim(),
          oddsAmerican: oddsNum,
          gameStartTime: new Date(`${gameDate}T${gameTime}`).toISOString(),
          leagueId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim');

      setStep('done');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim');
    } finally {
      setIsClaiming(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-semibold">
        <CheckCircle2 size={18} />
        You&apos;re in! Good luck 🤞
      </div>
    );
  }

  if (claimed && claimedBet) {
    const s = claimedBet.status;
    return (
      <div className={`space-y-2 px-4 py-3 rounded-xl border ${STATUS_STYLES[s]}`}>
        <div className="flex items-center justify-between font-semibold">
          <span>Your pick: <span className="font-normal">{claimedBet.description}</span></span>
          <span>{STATUS_LABELS[s]}</span>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold">
        <CheckCircle2 size={18} />
        Claimed — waiting on results
      </div>
    );
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('form')}
        className="btn-primary w-full text-base py-3"
      >
        🎯 Make My Pick
      </button>
    );
  }

  // Form step — user fills in their specific pick
  return (
    <div className="space-y-4 border border-primary/30 rounded-xl p-4 bg-primary/5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm text-primary">Your Pick ({sport})</p>
        <button onClick={() => { setStep('idle'); setError(''); }} className="text-xs text-gray-400 hover:text-white">✕ Cancel</button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Your specific pick *</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Aaron Judge to hit a home run"
            maxLength={300}
            className="w-full px-3 py-2 bg-background border border-gray-700 rounded-xl text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Your odds (+) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+</span>
              <input
                type="number" value={odds} onChange={(e) => setOdds(e.target.value)}
                placeholder="300" min={100} max={10000}
                className="w-full pl-7 pr-3 py-2 bg-background border border-gray-700 rounded-xl text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">From your sportsbook</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Game / Event Date *</label>
            <input
              type="date" value={gameDate} onChange={(e) => setGameDate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-gray-700 rounded-xl text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Game Start Time</label>
          <input
            type="time" value={gameTime} onChange={(e) => setGameTime(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-gray-700 rounded-xl text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleClaim}
        disabled={isClaiming}
        className="btn-primary w-full disabled:opacity-50"
      >
        {isClaiming ? (
          <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Submitting...</span>
        ) : 'Submit My Pick'}
      </button>
    </div>
  );
}
