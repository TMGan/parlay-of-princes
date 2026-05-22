'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';

interface Bet {
  id: string;
  description: string;
  oddsLocked: number;
  gameStartTime: Date;
}

export function EditBetModal({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const router = useRouter();
  const [description, setDescription] = useState(bet.description);
  const [odds, setOdds] = useState(String(bet.oddsLocked));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/bets/${bet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, oddsAmerican: Number(odds) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update bet');

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background-light border border-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit Bet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-accent bg-accent/10 border border-accent/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              required
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Odds (American)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+</span>
              <input
                type="number"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                min={100}
                max={10000}
                required
                className="w-full pl-8 pr-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-700 rounded hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
