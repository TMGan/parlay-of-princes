'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import type { ParsedBonusBet } from '@/lib/db/bonus-bet-queries';

interface Props {
  bonusBets: ParsedBonusBet[];
}

export function BonusBetList({ bonusBets }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bonus pick? This cannot be undone.')) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/bonus-bets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.refresh();
    } catch {
      alert('Failed to delete bonus pick');
    } finally {
      setDeletingId(null);
    }
  };

  if (bonusBets.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-4">
        No bonus picks created yet. Create one above to make it available to users.
      </p>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-3">
      {bonusBets.map((bet) => {
        const isActive =
          new Date(bet.availableDate) <= now && new Date(bet.expiryDate) >= now;
        const isExpired = new Date(bet.expiryDate) < now;

        return (
          <div key={bet.id} className="flex items-start justify-between p-4 bg-background rounded border border-gray-800">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold truncate">{bet.name}</span>
                {isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 shrink-0">
                    Active
                  </span>
                )}
                {isExpired && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 shrink-0">
                    Expired
                  </span>
                )}
                {!isActive && !isExpired && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 shrink-0">
                    Upcoming
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-400 truncate">{bet.description}</p>

              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{bet.parameters.sport}</span>
                <span className="text-primary">+{bet.parameters.oddsAmerican}</span>
                <span>
                  Available: {new Date(bet.availableDate).toLocaleDateString()} –{' '}
                  {new Date(bet.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleDelete(bet.id)}
              disabled={deletingId === bet.id}
              className="ml-4 p-2 text-gray-500 hover:text-accent transition-colors disabled:opacity-40 shrink-0"
              title="Delete bonus pick"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
