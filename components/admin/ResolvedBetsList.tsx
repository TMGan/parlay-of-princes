'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatOdds } from '@/lib/utils/format';

export interface ResolvedBet {
  id: string;
  sport: string;
  weekNumber: number;
  description: string;
  oddsAmerican: number;
  isKingLock: boolean;
  status: 'WON' | 'LOST';
  gameStartTime: string;
  user: {
    username: string;
  };
}

export function ResolvedBetsList({ bets }: { bets: ResolvedBet[] }) {
  const router = useRouter();
  const [isOverriding, setIsOverriding] = useState<string | null>(null);

  const handleOverride = async (betId: string, currentStatus: 'WON' | 'LOST') => {
    const newStatus = currentStatus === 'WON' ? 'LOST' : 'WON';
    const confirmed = confirm(
      `Change this bet from ${currentStatus} to ${newStatus}?\n\nThis will automatically adjust the user's points.`
    );
    if (!confirmed) return;

    setIsOverriding(betId);
    try {
      const response = await fetch('/api/admin/override-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to override bet');
      }

      const result = await response.json();
      alert(
        `Bet changed from ${result.oldStatus} to ${result.newStatus}\nPoints adjusted: ${
          result.pointsAdjustment > 0 ? '+' : ''
        }${result.pointsAdjustment}`
      );
      router.refresh();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('An error occurred');
      alert(`Error: ${err.message}`);
    } finally {
      setIsOverriding(null);
    }
  };

  if (bets.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400 text-sm">No recently resolved bets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map((bet) => (
        <div key={bet.id} className="card p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-semibold text-secondary">{bet.sport}</span>
                <span className="text-xs text-gray-500">Week {bet.weekNumber}</span>
                {bet.isKingLock && <span className="text-xs">👑 King Lock</span>}
              </div>
              <p className="text-sm">{bet.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {bet.user.username} • {formatOdds(bet.oddsAmerican)} •{' '}
                {new Date(bet.gameStartTime).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  bet.status === 'WON'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-red-500/20 text-red-500'
                }`}
              >
                {bet.status}
              </span>
              <button
                onClick={() => handleOverride(bet.id, bet.status)}
                disabled={isOverriding === bet.id}
                className="text-xs px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 rounded hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
              >
                {isOverriding === bet.id ? 'Changing...' : `Change to ${bet.status === 'WON' ? 'LOST' : 'WON'}`}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
