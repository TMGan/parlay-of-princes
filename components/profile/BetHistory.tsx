'use client';

import { useState, useMemo } from 'react';
import { formatOdds } from '@/lib/utils/format';
import { History } from 'lucide-react';

interface Bet {
  id: string;
  sport: string;
  description: string;
  oddsLocked: number;
  isKingLock: boolean;
  isBonusBet: boolean;
  status: string;
  weekNumber: number;
  pointsAwarded: number | null;
  gameStartTime: Date;
  createdAt: Date;
}

const STATUS_STYLE: Record<string, string> = {
  WON: 'bg-green-500/10 text-green-500',
  LOST: 'bg-red-500/10 text-red-500',
  VOIDED: 'bg-gray-500/10 text-gray-500',
  PENDING: 'bg-yellow-500/10 text-yellow-500',
};

export function BetHistory({ bets }: { bets: Bet[] }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sportFilter, setSportFilter] = useState('ALL');

  const sports = useMemo(() => {
    const set = new Set(bets.map((b) => b.sport));
    return ['ALL', ...Array.from(set).sort()];
  }, [bets]);

  const filtered = useMemo(() => {
    return bets.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (sportFilter !== 'ALL' && b.sport !== sportFilter) return false;
      return true;
    });
  }, [bets, statusFilter, sportFilter]);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <History size={20} className="text-gray-400" />
          Bet History
          <span className="text-sm font-normal text-gray-500">({bets.length} total)</span>
        </h2>

        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-background border border-gray-800 rounded text-sm focus:border-primary focus:outline-none"
          >
            {['ALL', 'PENDING', 'WON', 'LOST', 'VOIDED'].map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
            ))}
          </select>

          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3 py-1.5 bg-background border border-gray-800 rounded text-sm focus:border-primary focus:outline-none"
          >
            {sports.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Sports' : s}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400">No bets match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filtered.map((bet) => (
            <div
              key={bet.id}
              className="bg-background p-3 rounded-lg border border-gray-800 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-xs font-medium text-gray-400">Wk {bet.weekNumber}</span>
                  <span className="text-xs font-semibold text-secondary px-1.5 py-0.5 bg-secondary/10 rounded">
                    {bet.sport}
                  </span>
                  {bet.isKingLock && (
                    <span className="text-xs text-primary">👑</span>
                  )}
                  {bet.isBonusBet && (
                    <span className="text-xs text-amber-400">⭐</span>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{bet.description}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatOdds(bet.oddsLocked)}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-1 rounded block ${STATUS_STYLE[bet.status] ?? STATUS_STYLE.PENDING}`}>
                  {bet.status}
                </span>
                {bet.pointsAwarded !== null && (
                  <p className="text-xs text-green-500 mt-1">+{bet.pointsAwarded} pts</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
