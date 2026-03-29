'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface CreateLeagueForm {
  name: string;
  description: string;
  isPublic: boolean;
  maxMembers: number;
}

export default function CreateLeaguePage() {
  const router = useRouter();

  const [form, setForm] = useState<CreateLeagueForm>({
    name: '',
    description: '',
    isPublic: false,
    maxMembers: 20,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateForm = (updates: Partial<CreateLeagueForm>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (form.name.trim().length < 3) {
      setError('League name must be at least 3 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/leagues/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          isPublic: form.isPublic,
          maxMembers: form.maxMembers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create league');
      }

      router.push(`/leagues/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Create a League
        </h1>
        <p className="text-gray-400 mt-2">Start your own competition and invite friends</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            League Name <span className="text-accent">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="e.g., Work Squad, College Friends"
            maxLength={50}
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
            required
            aria-required="true"
          />
          <p className="text-xs text-gray-500 mt-1">{form.name.length}/50 characters</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            placeholder="Tell others what this league is about..."
            rows={3}
            maxLength={200}
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{form.description.length}/200 characters</p>
        </div>

        <div>
          <label htmlFor="maxMembers" className="block text-sm font-medium mb-2">
            Maximum Members
          </label>
          <select
            id="maxMembers"
            value={form.maxMembers}
            onChange={(e) => updateForm({ maxMembers: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
          >
            {[5, 10, 15, 20, 25, 30].map((n) => (
              <option key={n} value={n}>
                {n} members
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => updateForm({ isPublic: e.target.checked })}
              className="mt-1"
            />
            <div>
              <span className="text-sm font-medium">Public League</span>
              <p className="text-xs text-gray-400 mt-1">
                Anyone with the join code can join immediately. If unchecked, you must approve
                join requests.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || form.name.trim().length < 3}
            className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Creating...
              </span>
            ) : (
              'Create League'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
