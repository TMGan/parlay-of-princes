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
  claimed: boolean;
  claimedStatus: BetStatus | null;
}

export function BonusBetClaimButton({ bonusBetId, claimed, claimedStatus }: Props) {
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState('');
  const [justClaimed, setJustClaimed] = useState(false);

  const handleClaim = async () => {
    setIsClaiming(true);
    setError('');

    try {
      const res = await fetch('/api/bets/place-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusBetId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim bonus pick');

      setJustClaimed(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim');
    } finally {
      setIsClaiming(false);
    }
  };

  if (justClaimed) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-semibold">
        <CheckCircle2 size={18} />
        You&apos;re in! Good luck 🤞
      </div>
    );
  }

  if (claimed && claimedStatus) {
    return (
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg border font-semibold ${STATUS_STYLES[claimedStatus]}`}>
        <span>You claimed this pick</span>
        <span>{STATUS_LABELS[claimedStatus]}</span>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold">
        <CheckCircle2 size={18} />
        Claimed — waiting on results
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={handleClaim}
        disabled={isClaiming}
        className="btn-primary w-full disabled:opacity-50 text-base py-3"
      >
        {isClaiming ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            Claiming...
          </span>
        ) : (
          '🎯 Take This Pick'
        )}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Counts as your bonus bet for the week
      </p>
    </div>
  );
}
