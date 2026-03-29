'use client';

import { useEffect, useState } from 'react';
import { formatPoints } from '@/lib/utils/format';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Bet {
  id: string;
  weekNumber: number;
  sport: string;
  description: string;
  oddsAmerican: number;
  status: string;
  isKingLock: boolean;
  gameStartTime: string;
}

export function UserDetailsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserBets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const fetchUserBets = async () => {
    try {
      const response = await fetch(`/api/admin/user-bets?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch bets');
      const data = await response.json();
      setBets(data);
    } catch (error) {
      console.error('Error fetching user bets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light border border-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-background-light border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{user.username}&apos;s Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Bets</p>
              <p className="font-medium">{bets.length}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Betting History</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : bets.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No bets placed yet</p>
            ) : (
              <div className="space-y-2">
                {bets.map((bet) => (
                  <div
                    key={bet.id}
                    className="bg-background p-4 rounded border border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-semibold text-secondary">{bet.sport}</span>
                          <span className="text-xs text-gray-500">Week {bet.weekNumber}</span>
                          {bet.isKingLock && (
                            <span className="text-xs">👑 King Lock</span>
                          )}
                        </div>
                        <p className="text-sm">{bet.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(bet.gameStartTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          {formatPoints(bet.oddsAmerican)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            bet.status === 'WON'
                              ? 'bg-green-500/20 text-green-500'
                              : bet.status === 'LOST'
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-yellow-500/20 text-yellow-500'
                          }`}
                        >
                          {bet.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
