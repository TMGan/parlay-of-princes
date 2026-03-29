'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function JoinLeaguePage() {
  const router = useRouter();

  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    const trimmedCode = joinCode.trim().toUpperCase();

    if (trimmedCode.length < 6) {
      setError('Join code must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: trimmedCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join league');
      }

      if (data.needsApproval) {
        setSuccessMessage(data.message);
        setJoinCode('');
      } else {
        router.push(`/leagues/${data.leagueId}`);
        router.refresh();
      }
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
          Join a League
        </h1>
        <p className="text-gray-400 mt-2">Enter the join code to join an existing league</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm" role="alert">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded text-sm" role="status">
            {successMessage}
          </div>
        )}

        <div>
          <label htmlFor="joinCode" className="block text-sm font-medium mb-2">
            Join Code <span className="text-accent">*</span>
          </label>
          <input
            id="joinCode"
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g., ABC123"
            maxLength={10}
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none text-center text-2xl tracking-widest font-mono uppercase"
            required
            aria-required="true"
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Ask the league admin for the join code
          </p>
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
            disabled={isSubmitting || joinCode.trim().length < 6}
            className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Joining...
              </span>
            ) : (
              'Join League'
            )}
          </button>
        </div>
      </form>

      <div className="card bg-background-light/50 p-6">
        <h3 className="text-sm font-semibold mb-3">How to Join</h3>
        <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
          <li>Get the join code from the league admin</li>
          <li>Enter it above and click &quot;Join League&quot;</li>
          <li>If it&apos;s a public league, you&apos;re in immediately</li>
          <li>If it&apos;s a private league, wait for admin approval</li>
        </ol>
      </div>
    </div>
  );
}
