'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckSquare, Square, Zap } from 'lucide-react';
import { formatOdds } from '@/lib/utils/format';

interface Bet {
  id: string;
  sport: string;
  description: string;
  oddsLocked: number;
  weekNumber: number;
  isKingLock: boolean;
  gameStartTime: Date;
  user: { username: string };
}

export function BulkResolvePanel({ bets }: { bets: Bet[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => prev.size === bets.length ? new Set() : new Set(bets.map((b) => b.id)));
  };

  const bulkResolve = async (status: 'WON' | 'LOST' | 'VOIDED') => {
    if (selected.size === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/bulk-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betIds: [...selected], status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk resolve failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (bets.length === 0) return null;

  return (
    <div className="card border-secondary/30 bg-secondary/5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-secondary" />
          <h3 className="font-bold text-secondary">Bulk Resolve</h3>
          {selected.size > 0 && (
            <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
              {selected.size} selected
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleAll}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            {selected.size === bets.length ? <CheckSquare size={14} /> : <Square size={14} />}
            {selected.size === bets.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {bets.map((bet) => (
          <label
            key={bet.id}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected.has(bet.id)
                ? 'border-secondary/50 bg-secondary/10'
                : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(bet.id)}
              onChange={() => toggle(bet.id)}
              className="mt-0.5 accent-secondary"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-secondary font-medium">{bet.sport}</span>
                <span className="text-xs text-gray-400">@{bet.user.username}</span>
                {bet.isKingLock && <span className="text-xs text-primary">👑</span>}
              </div>
              <p className="text-sm mt-0.5 truncate">{bet.description}</p>
              <p className="text-xs text-gray-500">{formatOdds(bet.oddsLocked)}</p>
            </div>
          </label>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="flex gap-2 pt-2 border-t border-gray-800">
          <span className="text-sm text-gray-400 flex items-center mr-2">Resolve {selected.size} as:</span>
          {(['WON', 'LOST', 'VOIDED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => bulkResolve(s)}
              disabled={isLoading}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                s === 'WON' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                : s === 'LOST' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
              }`}
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
