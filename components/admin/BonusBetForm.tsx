'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL'];

export function BonusBetForm() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    sport: '',
    oddsAmerican: '',
    gameStartTime: '',
    availableDate: '',
    expiryDate: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/bonus-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          oddsAmerican: Number(form.oddsAmerican),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create bonus bet');

      setForm({ name: '', description: '', sport: '', oddsAmerican: '', gameStartTime: '', availableDate: '', expiryDate: '' });
      setIsExpanded(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="btn-primary"
      >
        + Create Bonus Pick
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">New Bonus Pick</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-sm text-gray-400 hover:text-white"
        >
          ✕ Cancel
        </button>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. King's Gambit"
            maxLength={100}
            required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sport *</label>
          <select
            value={form.sport}
            onChange={set('sport')}
            required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          >
            <option value="">Select sport...</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Pick Description *</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            placeholder="e.g. Chiefs ML vs Raiders"
            maxLength={500}
            rows={2}
            required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Odds (American) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+</span>
            <input
              type="number"
              value={form.oddsAmerican}
              onChange={set('oddsAmerican')}
              placeholder="150"
              min={100}
              max={10000}
              required
              className="w-full pl-8 pr-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Game Start Time *</label>
          <input
            type="datetime-local"
            value={form.gameStartTime}
            onChange={set('gameStartTime')}
            required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Available From *</label>
          <input
            type="datetime-local"
            value={form.availableDate}
            onChange={set('availableDate')}
            required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expires At *</label>
          <input
            type="datetime-local"
            value={form.expiryDate}
            onChange={set('expiryDate')}
            required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Creating...
          </span>
        ) : (
          'Create Bonus Pick'
        )}
      </button>
    </form>
  );
}
