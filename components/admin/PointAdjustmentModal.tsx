'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface UserLeague {
  id: string;
  name: string;
  leaguePoints: number;
}

interface User {
  id: string;
  username: string;
  totalPoints: number;
}

interface Props {
  user: User;
  onClose: () => void;
}

export function PointAdjustmentModal({ user, onClose }: Props) {
  const router = useRouter();

  const [leagues, setLeagues] = useState<UserLeague[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [leagueId, setLeagueId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch the user's leagues when the modal opens
  useEffect(() => {
    fetch(`/api/admin/user-leagues?userId=${user.id}`)
      .then((r) => r.json())
      .then((data: UserLeague[]) => {
        setLeagues(data);
        if (data.length === 1) setLeagueId(data[0]!.id); // auto-select if only one
      })
      .catch(() => setError('Failed to load leagues'))
      .finally(() => setLoadingLeagues(false));
  }, [user.id]);

  const selectedLeague = leagues.find((l) => l.id === leagueId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum === 0) {
      setError('Amount must be a non-zero number');
      return;
    }
    if (!leagueId) {
      setError('Please select a league');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, leagueId, amount: amountNum, reason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust points');

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light border border-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Adjust League Points</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-400 mb-0.5">Adjusting points for:</p>
            <p className="text-lg font-bold">@{user.username}</p>
          </div>

          {/* League selector */}
          <div>
            <label className="block text-sm font-medium mb-2">League *</label>
            {loadingLeagues ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 size={14} className="animate-spin" /> Loading leagues…
              </div>
            ) : leagues.length === 0 ? (
              <p className="text-sm text-gray-500">This user is not in any leagues.</p>
            ) : (
              <select
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none text-sm"
                required
              >
                <option value="">Select a league…</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.leaguePoints} pts current
                  </option>
                ))}
              </select>
            )}
            {selectedLeague && (
              <p className="text-xs text-gray-500 mt-1">
                Current league points: <span className="text-primary font-semibold">{selectedLeague.leaguePoints}</span>
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100 or -50"
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Positive to add, negative to subtract</p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Corrected incorrect bet resolution"
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none resize-none text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/200</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingLeagues || leagues.length === 0}
              className="btn-primary px-6 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? 'Adjusting…' : 'Adjust Points'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
