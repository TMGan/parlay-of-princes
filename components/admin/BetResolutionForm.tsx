'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function BetResolutionForm({ betId }: { betId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (status: 'WON' | 'LOST' | 'VOIDED') => {
    setIsLoading(true);
    setResolving(status);
    try {
      const res = await fetch('/api/admin/resolve-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId, status }),
      });
      if (!res.ok) throw new Error('Failed');
      router.refresh();
    } catch {
      alert('Failed to resolve bet');
    } finally {
      setIsLoading(false);
      setResolving(null);
    }
  };

  const btn = (label: string, status: 'WON' | 'LOST' | 'VOIDED', style: string) => (
    <button
      onClick={() => handleResolve(status)}
      disabled={isLoading}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 ${style}`}
    >
      {isLoading && resolving === status && <Loader2 size={13} className="animate-spin" />}
      {label}
    </button>
  );

  return (
    <div className="flex gap-2 flex-shrink-0">
      {btn('Won', 'WON', 'bg-green-500/10 text-green-500 hover:bg-green-500/20')}
      {btn('Lost', 'LOST', 'bg-red-500/10 text-red-500 hover:bg-red-500/20')}
      {btn('Void', 'VOIDED', 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20')}
    </div>
  );
}
