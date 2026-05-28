'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2 } from 'lucide-react';

interface UserLeague {
  id: string;
  name: string;
  leaguePoints: number;
  leagueBetsWon: number;
  leagueBiggestHit: number;
  // Admin overrides (current values stored in DB)
  leagueBetsWonOffset: number;
  leagueBiggestHitOverride: number | null;
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

  // Points adjustment fields
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  // Stat override fields
  const [showStatOverrides, setShowStatOverrides] = useState(false);
  const [betsWonOffset, setBetsWonOffset] = useState('');
  const [biggestHitOverride, setBiggestHitOverride] = useState('');
  const [clearBiggestHit, setClearBiggestHit] = useState(false);
  const [leagueBetsWonOffset, setLeagueBetsWonOffset] = useState('');
  const [leagueBiggestHitOverride, setLeagueBiggestHitOverride] = useState('');
  const [clearLeagueBiggestHit, setClearLeagueBiggestHit] = useState(false);

  const [isSubmittingPoints, setIsSubmittingPoints] = useState(false);
  const [isSubmittingStats, setIsSubmittingStats] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch(`/api/admin/user-leagues?userId=${user.id}`)
      .then((r) => r.json())
      .then((data: UserLeague[]) => {
        setLeagues(data);
        if (data.length === 1) setLeagueId(data[0]!.id);
      })
      .catch(() => setError('Failed to load leagues'))
      .finally(() => setLoadingLeagues(false));
  }, [user.id]);

  // Populate stat override fields whenever the selected league changes
  useEffect(() => {
    const league = leagues.find((l) => l.id === leagueId);
    if (!league) return;
    setLeagueBetsWonOffset(String(league.leagueBetsWonOffset));
    setLeagueBiggestHitOverride(league.leagueBiggestHitOverride != null ? String(league.leagueBiggestHitOverride) : '');
    setClearLeagueBiggestHit(false);
  }, [leagueId, leagues]);

  const selectedLeague = leagues.find((l) => l.id === leagueId);

  // ── Points adjustment ────────────────────────────────────────────────────
  const handleSubmitPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum === 0) { setError('Amount must be a non-zero number'); return; }
    if (!leagueId) { setError('Please select a league'); return; }
    if (!reason.trim()) { setError('Reason is required'); return; }

    setIsSubmittingPoints(true);
    try {
      const res = await fetch('/api/admin/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, leagueId, amount: amountNum, reason: reason.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to adjust points');

      setAmount('');
      setReason('');
      setSuccessMsg('Points adjusted successfully.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmittingPoints(false);
    }
  };

  // ── Stat overrides ───────────────────────────────────────────────────────
  const handleSubmitStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!leagueId) { setError('Please select a league first'); return; }

    // Build the payload — only include fields the admin actually changed
    type StatPayload = {
      userId: string;
      leagueId: string;
      betsWonOffset?: number;
      biggestHitOverride?: number | null;
      leagueBetsWonOffset?: number;
      leagueBiggestHitOverride?: number | null;
    };

    const payload: StatPayload = { userId: user.id, leagueId };

    if (betsWonOffset !== '') {
      const n = parseInt(betsWonOffset, 10);
      if (isNaN(n)) { setError('Global wins offset must be a whole number'); return; }
      payload.betsWonOffset = n;
    }

    if (clearBiggestHit) {
      payload.biggestHitOverride = null;
    } else if (biggestHitOverride !== '') {
      const n = parseInt(biggestHitOverride, 10);
      if (isNaN(n) || n < 0) { setError('Biggest hit override must be a non-negative number'); return; }
      payload.biggestHitOverride = n;
    }

    if (leagueBetsWonOffset !== '') {
      const n = parseInt(leagueBetsWonOffset, 10);
      if (isNaN(n)) { setError('League wins offset must be a whole number'); return; }
      payload.leagueBetsWonOffset = n;
    }

    if (clearLeagueBiggestHit) {
      payload.leagueBiggestHitOverride = null;
    } else if (leagueBiggestHitOverride !== '') {
      const n = parseInt(leagueBiggestHitOverride, 10);
      if (isNaN(n) || n < 0) { setError('League biggest hit override must be a non-negative number'); return; }
      payload.leagueBiggestHitOverride = n;
    }

    const hasChange =
      payload.betsWonOffset !== undefined ||
      payload.biggestHitOverride !== undefined ||
      payload.leagueBetsWonOffset !== undefined ||
      payload.leagueBiggestHitOverride !== undefined;

    if (!hasChange) { setError('No stat changes were entered'); return; }

    setIsSubmittingStats(true);
    try {
      const res = await fetch('/api/admin/adjust-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to adjust stats');

      setSuccessMsg('Stats updated successfully.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmittingStats(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light border border-gray-800 rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-background-light z-10">
          <h2 className="text-xl font-bold">Admin Adjustments</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-lg">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-xl text-sm">{successMsg}</div>
          )}

          {/* User label */}
          <div>
            <p className="text-sm text-gray-400 mb-0.5">Adjusting for:</p>
            <p className="text-lg font-bold">@{user.username}</p>
          </div>

          {/* League selector (shared between both forms) */}
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
              >
                <option value="">Select a league…</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.leaguePoints} pts
                  </option>
                ))}
              </select>
            )}
            {selectedLeague && (
              <p className="text-xs text-gray-500 mt-1">
                Points:{' '}
                <span className="text-primary font-semibold">{selectedLeague.leaguePoints}</span>
                {' · '}Wins:{' '}
                <span className="text-green-400 font-semibold">{selectedLeague.leagueBetsWon}</span>
                {' · '}Best hit:{' '}
                <span className="text-yellow-400 font-semibold">{selectedLeague.leagueBiggestHit}</span>
              </p>
            )}
          </div>

          {/* ── Section 1: Point Adjustment ─────────────────────────────── */}
          <form onSubmit={handleSubmitPoints} className="space-y-4 pt-2 border-t border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Point Adjustment</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Amount *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100 or -50"
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Positive to add, negative to subtract</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Corrected incorrect bet resolution"
                rows={2}
                maxLength={200}
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none resize-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{reason.length}/200</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingPoints || loadingLeagues || leagues.length === 0}
                className="btn-primary px-6 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isSubmittingPoints && <Loader2 size={14} className="animate-spin" />}
                {isSubmittingPoints ? 'Adjusting…' : 'Adjust Points'}
              </button>
            </div>
          </form>

          {/* ── Section 2: Stat Overrides ────────────────────────────────── */}
          <div className="border-t border-gray-800 pt-2">
            <button
              type="button"
              onClick={() => setShowStatOverrides((v) => !v)}
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 uppercase tracking-wide hover:text-white transition-colors"
            >
              <span>Stat Overrides</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${showStatOverrides ? 'rotate-180' : ''}`}
              />
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Override wins count and biggest hit. These persist through bet resolutions.
            </p>

            {showStatOverrides && (
              <form onSubmit={handleSubmitStats} className="space-y-5 mt-4">

                {/* League-level overrides */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">League Stats</p>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Wins offset
                      <span className="text-gray-500 font-normal ml-1">(added to derived count)</span>
                    </label>
                    <input
                      type="number"
                      value={leagueBetsWonOffset}
                      onChange={(e) => setLeagueBetsWonOffset(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">e.g. 1 to add a win, -1 to remove one</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Biggest hit override
                      <span className="text-gray-500 font-normal ml-1">(replaces derived value)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={clearLeagueBiggestHit ? '' : leagueBiggestHitOverride}
                      onChange={(e) => {
                        setLeagueBiggestHitOverride(e.target.value);
                        setClearLeagueBiggestHit(false);
                      }}
                      placeholder={clearLeagueBiggestHit ? 'Will be cleared' : 'e.g. 500'}
                      disabled={clearLeagueBiggestHit}
                      className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none text-sm disabled:opacity-40"
                    />
                    <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clearLeagueBiggestHit}
                        onChange={(e) => {
                          setClearLeagueBiggestHit(e.target.checked);
                          if (e.target.checked) setLeagueBiggestHitOverride('');
                        }}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-xs text-gray-500">Clear override (revert to calculated)</span>
                    </label>
                  </div>
                </div>

                {/* Global user-level overrides */}
                <div className="space-y-3 pt-3 border-t border-gray-800/60">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Global Stats</p>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Global wins offset
                    </label>
                    <input
                      type="number"
                      value={betsWonOffset}
                      onChange={(e) => setBetsWonOffset(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Global biggest hit override
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={clearBiggestHit ? '' : biggestHitOverride}
                      onChange={(e) => {
                        setBiggestHitOverride(e.target.value);
                        setClearBiggestHit(false);
                      }}
                      placeholder={clearBiggestHit ? 'Will be cleared' : 'e.g. 500'}
                      disabled={clearBiggestHit}
                      className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none text-sm disabled:opacity-40"
                    />
                    <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clearBiggestHit}
                        onChange={(e) => {
                          setClearBiggestHit(e.target.checked);
                          if (e.target.checked) setBiggestHitOverride('');
                        }}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-xs text-gray-500">Clear override (revert to calculated)</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingStats || loadingLeagues || leagues.length === 0}
                    className="btn-primary px-6 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {isSubmittingStats && <Loader2 size={14} className="animate-spin" />}
                    {isSubmittingStats ? 'Saving…' : 'Save Stat Overrides'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800 pt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
