'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface ActiveBonusPick {
  id: string;
  name: string;
  description: string;
  sport: string;
  expiryDate: string; // ISO string — serialized from server
}

interface Props {
  picks: ActiveBonusPick[];
  leagueId: string;
}

interface ClaimFormState {
  open: boolean;
  description: string;
  odds: string;
  gameDate: string;
  gameTime: string;
  error: string;
  submitting: boolean;
  done: boolean;
}

function BonusPickCard({ pick, leagueId }: { pick: ActiveBonusPick; leagueId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ClaimFormState>({
    open: false,
    description: '',
    odds: '',
    gameDate: '',
    gameTime: '20:00',
    error: '',
    submitting: false,
    done: false,
  });

  const set = (partial: Partial<ClaimFormState>) => setForm((prev) => ({ ...prev, ...partial }));

  const hoursLeft = Math.max(
    0,
    Math.round((new Date(pick.expiryDate).getTime() - Date.now()) / 3_600_000)
  );

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.odds || !form.gameDate) {
      set({ error: 'All fields are required' });
      return;
    }
    const oddsNum = Number(form.odds);
    if (isNaN(oddsNum) || oddsNum < 100 || oddsNum > 10000) {
      set({ error: 'Odds must be between +100 and +10000' });
      return;
    }
    const gameStartTime = new Date(`${form.gameDate}T${form.gameTime}`);
    if (gameStartTime <= new Date()) {
      set({ error: 'Game start time must be in the future' });
      return;
    }

    set({ submitting: true, error: '' });
    try {
      const res = await fetch('/api/bets/place-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bonusBetId: pick.id,
          description: form.description.trim(),
          oddsAmerican: oddsNum,
          gameStartTime: gameStartTime.toISOString(),
          leagueId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to claim');
      set({ done: true });
      router.refresh();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to claim', submitting: false });
    }
  };

  if (form.done) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold">
        <CheckCircle2 size={15} />
        <span>
          <span className="text-white">{pick.name}</span> — you&apos;re in! Good luck 🤞
        </span>
      </div>
    );
  }

  return (
    <div className="border border-secondary/30 rounded-2xl overflow-hidden bg-secondary/5">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => set({ open: !form.open })}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/10 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Crown size={14} className="text-secondary shrink-0" />
          <span className="text-sm font-semibold text-secondary truncate">{pick.name}</span>
          <span className="text-xs text-gray-500 shrink-0">{pick.sport}</span>
          {hoursLeft <= 3 && (
            <span className="text-xs text-amber-400 shrink-0">⚠ {hoursLeft}h left</span>
          )}
        </div>
        {form.open ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
      </button>

      {/* Expandable claim form */}
      {form.open && (
        <div className="px-4 pb-4 space-y-3 border-t border-secondary/20">
          <p className="text-xs text-gray-400 pt-3">{pick.description}</p>

          {form.error && <p className="text-xs text-red-400">{form.error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Your specific pick *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="e.g. Aaron Judge to hit a home run"
              maxLength={300}
              className="w-full px-3 py-2 bg-background border border-gray-700 rounded-xl text-sm focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Odds (+) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+</span>
                <input
                  type="number"
                  value={form.odds}
                  onChange={(e) => set({ odds: e.target.value })}
                  placeholder="300"
                  min={100}
                  max={10000}
                  className="w-full pl-7 pr-3 py-2 bg-background border border-gray-700 rounded-xl text-sm focus:border-secondary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Game Date *</label>
              <input
                type="date"
                value={form.gameDate}
                onChange={(e) => set({ gameDate: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-gray-700 rounded-xl text-sm focus:border-secondary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Game Start Time</label>
            <input
              type="time"
              value={form.gameTime}
              onChange={(e) => set({ gameTime: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-gray-700 rounded-xl text-sm focus:border-secondary focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={form.submitting}
            className="w-full py-2 rounded-xl bg-secondary text-background text-sm font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {form.submitting && <Loader2 size={14} className="animate-spin" />}
            {form.submitting ? 'Submitting…' : '🎯 Submit My Pick'}
          </button>
        </div>
      )}
    </div>
  );
}

export function InlineBonusPicks({ picks, leagueId }: Props) {
  if (picks.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-secondary uppercase tracking-wide flex items-center gap-1.5">
        <Crown size={12} />
        {picks.length === 1 ? 'Bonus Pick Available' : `${picks.length} Bonus Picks Available`}
      </p>
      {picks.map((pick) => (
        <BonusPickCard key={pick.id} pick={pick} leagueId={leagueId} />
      ))}
    </div>
  );
}
