'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Loader2 } from 'lucide-react';
import { formatDateTimeET } from '@/lib/utils/format';

type BonusBetStatus = 'PENDING' | 'WON' | 'LOST' | 'VOIDED';

interface ActiveBonusBet {
  id: string;
  name: string;
  description: string;
  parameters: {
    sport: string;
    oddsAmerican: number;
    gameStartTime: string;
  };
  expiryDate: string;
  claimed: boolean;
  claimedBet: { status: BonusBetStatus } | null;
}

const STATUS_STYLES: Record<BonusBetStatus, string> = {
  WON: 'text-green-500',
  LOST: 'text-accent',
  VOIDED: 'text-gray-400',
  PENDING: 'text-yellow-500',
};

export function BonusBetCard() {
  const router = useRouter();
  const [bonusBet, setBonusBet] = useState<ActiveBonusBet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/bonus-bets/active')
      .then((r) => r.json())
      .then((data) => setBonusBet(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleClaim = async () => {
    if (!bonusBet) return;
    setIsClaiming(true);
    setError('');

    try {
      const res = await fetch('/api/bets/place-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusBetId: bonusBet.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim bonus pick');

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading || !bonusBet) return null;

  const claimStatus = bonusBet.claimedBet?.status;

  return (
    <div className="card border border-secondary/40 bg-secondary/5 space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Crown className="text-secondary" size={20} />
        <h3 className="text-lg font-bold text-secondary">Weekly Bonus Pick</h3>
      </div>

      <div>
        <p className="font-semibold">{bonusBet.name}</p>
        <p className="text-sm text-gray-400 mt-1">{bonusBet.description}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{bonusBet.parameters.sport}</span>
        <span className="font-bold text-primary">+{bonusBet.parameters.oddsAmerican}</span>
      </div>

      <p className="text-xs text-gray-500">
        Game: {formatDateTimeET(bonusBet.parameters.gameStartTime)}
      </p>

      {error && <p className="text-sm text-accent">{error}</p>}

      {bonusBet.claimed && claimStatus ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Claimed</span>
          <span className={`font-bold ${STATUS_STYLES[claimStatus]}`}>
            {claimStatus.charAt(0) + claimStatus.slice(1).toLowerCase()}
          </span>
        </div>
      ) : bonusBet.claimed ? (
        <p className="text-sm text-gray-400">Claimed — awaiting resolution</p>
      ) : (
        <button
          onClick={handleClaim}
          disabled={isClaiming}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isClaiming ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Claiming...
            </span>
          ) : (
            'Claim Bonus Pick'
          )}
        </button>
      )}
    </div>
  );
}
