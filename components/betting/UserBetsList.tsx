'use client';

import { useState } from 'react';
import { Pencil, Trophy } from 'lucide-react';
import { formatOdds } from '@/lib/utils/format';
import { DeleteBetButton } from './DeleteBetButton';
import { EditBetModal } from './EditBetModal';
import { BetCountdown } from './BetCountdown';

interface Bet {
  id: string;
  sport: string;
  description: string;
  oddsLocked: number;
  isKingLock: boolean;
  isBonusBet: boolean;
  status: string;
  gameStartTime: Date;
  pointsAwarded: number | null;
}

const STATUS_STYLE: Record<string, string> = {
  WON: 'bg-green-500/10 text-green-500',
  LOST: 'bg-red-500/10 text-red-500',
  VOIDED: 'bg-gray-500/10 text-gray-500',
  PENDING: 'bg-yellow-500/10 text-yellow-500',
};

export function UserBetsList({ bets }: { bets: Bet[] }) {
  const [editingBet, setEditingBet] = useState<Bet | null>(null);

  if (bets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-gray-800/50 rounded-full mb-4">
          <Trophy className="text-gray-600" size={32} />
        </div>
        <p className="text-gray-300 font-medium">No bets placed yet</p>
        <p className="text-sm text-gray-500 mt-1">Use the form to place your first bet this week!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {bets.map((bet) => {
          const gameStarted = new Date(bet.gameStartTime) <= new Date();
          const canEdit = bet.status === 'PENDING' && !gameStarted;

          return (
            <div
              key={bet.id}
              className="bg-background p-4 rounded-2xl border border-gray-800 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded-full">
                    {bet.sport}
                  </span>
                  {bet.isKingLock && (
                    <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">
                      👑 KING LOCK
                    </span>
                  )}
                  {bet.isBonusBet && (
                    <span className="text-xs font-semibold text-amber-400 px-2 py-1 bg-amber-400/10 rounded-full">
                      ⭐ BONUS
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[bet.status] ?? STATUS_STYLE.PENDING}`}>
                    {bet.status}
                  </span>
                </div>

                <p className="font-medium mb-1 truncate">{bet.description}</p>

                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                  <span>{formatOdds(bet.oddsLocked)}</span>
                  <span>•</span>
                  <span>{new Date(bet.gameStartTime).toLocaleString()}</span>
                  {bet.status === 'PENDING' && (
                    <BetCountdown gameStartTime={new Date(bet.gameStartTime)} />
                  )}
                </div>

                {bet.pointsAwarded !== null && (
                  <p className="text-sm text-green-500 mt-1 font-medium">
                    +{bet.pointsAwarded} pts
                  </p>
                )}
              </div>

              {bet.status === 'PENDING' && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canEdit && (
                    <button
                      onClick={() => setEditingBet(bet)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                      title="Edit bet"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  <DeleteBetButton betId={bet.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingBet && (
        <EditBetModal bet={editingBet} onClose={() => setEditingBet(null)} />
      )}
    </>
  );
}
