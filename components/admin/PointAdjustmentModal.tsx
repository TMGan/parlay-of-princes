'use client';

import { useState } from 'react';

interface User {
  id: string;
  username: string;
  totalPoints: number;
}

export function PointAdjustmentModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const amountNum = parseInt(amount, 10);
      if (isNaN(amountNum) || amountNum === 0) {
        throw new Error('Amount must be a non-zero number');
      }

      if (!reason.trim()) {
        throw new Error('Reason is required');
      }

      const response = await fetch('/api/admin/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: amountNum,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to adjust points');
      }

      onClose();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light border border-gray-800 rounded-lg max-w-md w-full">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Adjust Points</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-400 mb-1">Adjusting points for:</p>
            <p className="text-lg font-bold">{user.username}</p>
            <p className="text-sm text-gray-400">
              Current: <span className="text-primary font-bold">{user.totalPoints}</span> points
            </p>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount *
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 100 or -50"
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use positive numbers to add points, negative to subtract
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-2">
              Reason *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Corrected incorrect bet resolution"
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/200 characters</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-6 disabled:opacity-50"
            >
              {isSubmitting ? 'Adjusting...' : 'Adjust Points'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
