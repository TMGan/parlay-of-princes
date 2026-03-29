'use client';

import { formatPoints } from '@/lib/utils/format';
import type { LeaderboardEntry } from '@/lib/types/league';

interface LeagueLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-500/20 text-yellow-500',
  2: 'bg-gray-400/20 text-gray-400',
  3: 'bg-amber-700/20 text-amber-700',
};

export function LeagueLeaderboard({ leaderboard, currentUserId }: LeagueLeaderboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <p className="text-sm text-gray-400">{leaderboard.length} competitors</p>
      </div>

      <div className="card overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No bets placed yet. Be the first to compete!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-light">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-4 w-16">Rank</th>
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4 text-right">Points</th>
                  <th className="px-6 py-4 text-center">W / L</th>
                  <th className="px-6 py-4 text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.userId === currentUserId;
                  const rank = index + 1;
                  const rankStyle = RANK_STYLES[rank] ?? 'bg-background text-gray-500';

                  return (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-background-light transition-colors ${
                        isCurrentUser ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${rankStyle}`}
                        >
                          {rank === 1 ? '👑' : rank}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
                            {entry.username}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                          {entry.role === 'ADMIN' && (
                            <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="text-xl font-bold text-primary">
                          {formatPoints(entry.totalPoints)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center text-sm">
                        <span className="text-green-500">{entry.betsWon}</span>
                        {' / '}
                        <span className="text-red-500">{entry.betsLost}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-20 h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-primary"
                              style={{ width: `${entry.winRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">
                            {entry.winRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
