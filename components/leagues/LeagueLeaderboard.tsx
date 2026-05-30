'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPoints } from '@/lib/utils/format';
import { Avatar } from '@/components/ui/Avatar';
import type { LeaderboardEntry } from '@/lib/types/league';

type Tab = 'points' | 'wins' | 'odds';

const TABS: { id: Tab; label: string }[] = [
  { id: 'points', label: 'Points' },
  { id: 'wins',   label: 'Most Wins' },
  { id: 'odds',   label: 'Best Odds' },
];

interface LeagueLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-500/20 text-yellow-500',
  2: 'bg-gray-400/20 text-gray-400',
  3: 'bg-amber-700/20 text-amber-700',
};

function sortedEntries(entries: LeaderboardEntry[], tab: Tab): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (tab === 'points') return b.totalPoints - a.totalPoints;
    if (tab === 'wins')   return b.betsWon - a.betsWon || b.totalPoints - a.totalPoints;
    /* odds */            return b.biggestOdds - a.biggestOdds || b.totalPoints - a.totalPoints;
  });
}

function getPositionHint(
  sorted: LeaderboardEntry[],
  index: number,
  tab: Tab,
): { text: string; className: string } | null {
  const current = sorted[index];
  if (!current) return null;

  if (sorted.length <= 1) {
    return index === 0 ? { text: 'Uncontested! 👑', className: 'text-green-500' } : null;
  }

  const above = sorted[index - 1];

  if (index === 0) {
    const second = sorted[1];
    if (!second) return null;

    if (tab === 'points') {
      const diff = current.totalPoints - second.totalPoints;
      return { text: `Leading by +${formatPoints(diff)} pts`, className: 'text-green-500' };
    }
    if (tab === 'wins') {
      const diff = current.betsWon - second.betsWon;
      return diff > 0
        ? { text: `Leading by ${diff} win${diff !== 1 ? 's' : ''}`, className: 'text-green-500' }
        : { text: 'Tied for 1st', className: 'text-yellow-500' };
    }
    // odds
    const diff = current.biggestOdds - second.biggestOdds;
    return diff > 0
      ? { text: `Leading by +${diff} odds`, className: 'text-green-500' }
      : { text: 'Tied for 1st', className: 'text-yellow-500' };
  }

  if (!above) return null;

  if (tab === 'points') {
    const diff = above.totalPoints - current.totalPoints;
    return { text: `Need +${formatPoints(diff)} pts to pass ${above.username}`, className: 'text-yellow-500' };
  }
  if (tab === 'wins') {
    const diff = above.betsWon - current.betsWon;
    return diff > 0
      ? { text: `${diff} win${diff !== 1 ? 's' : ''} behind ${above.username}`, className: 'text-yellow-500' }
      : { text: `Tied with ${above.username}`, className: 'text-blue-400' };
  }
  // odds
  const diff = above.biggestOdds - current.biggestOdds;
  return diff > 0
    ? { text: `+${diff} odds behind ${above.username}`, className: 'text-yellow-500' }
    : { text: `Tied with ${above.username}`, className: 'text-blue-400' };
}

export function LeagueLeaderboard({ leaderboard, currentUserId }: LeagueLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('points');
  const sorted = sortedEntries(leaderboard, activeTab);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <p className="text-sm text-gray-400">{leaderboard.length} competitor{leaderboard.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-background rounded-xl border border-gray-800 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-background'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {sorted.length === 0 ? (
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

                  {activeTab === 'points' && (
                    <>
                      <th className="px-6 py-4 text-right">Points</th>
                      <th className="px-6 py-4 text-center">W / L</th>
                      <th className="px-6 py-4 text-center">Win Rate</th>
                    </>
                  )}

                  {activeTab === 'wins' && (
                    <>
                      <th className="px-6 py-4 text-right">Wins</th>
                      <th className="px-6 py-4 text-center">W / L</th>
                      <th className="px-6 py-4 text-center">Win Rate</th>
                    </>
                  )}

                  {activeTab === 'odds' && (
                    <>
                      <th className="px-6 py-4 text-right">Best Odds Hit</th>
                      <th className="px-6 py-4 text-center">Points</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {sorted.map((entry, index) => {
                  const isCurrentUser = entry.userId === currentUserId;
                  const rank = index + 1;
                  const rankStyle = RANK_STYLES[rank] ?? 'bg-background text-gray-500';
                  const hint = isCurrentUser ? getPositionHint(sorted, index, activeTab) : null;

                  return (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-background-light transition-colors ${
                        isCurrentUser ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${rankStyle}`}>
                          {rank === 1 ? '👑' : rank}
                        </div>
                      </td>

                      {/* Player */}
                      <td className="px-6 py-4">
                        <Link
                          href={isCurrentUser ? '/profile' : `/players/${entry.username}`}
                          className="flex items-center gap-3 group"
                        >
                          <Avatar username={entry.username} size="sm" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium group-hover:underline ${isCurrentUser ? 'text-primary' : ''}`}>
                              {entry.username}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">You</span>
                            )}
                            {entry.role === 'ADMIN' && (
                              <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">Admin</span>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* Points tab columns */}
                      {activeTab === 'points' && (
                        <>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xl font-bold text-primary">
                              {formatPoints(entry.totalPoints)}
                            </span>
                            {hint && <p className={`text-xs mt-1 ${hint.className}`}>{hint.text}</p>}
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
                              <span className="text-sm font-medium w-10 text-right">{entry.winRate}%</span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* Wins tab columns */}
                      {activeTab === 'wins' && (
                        <>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xl font-bold text-green-400">{entry.betsWon}</span>
                            {hint && <p className={`text-xs mt-1 ${hint.className}`}>{hint.text}</p>}
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
                              <span className="text-sm font-medium w-10 text-right">{entry.winRate}%</span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* Best Odds tab columns */}
                      {activeTab === 'odds' && (
                        <>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xl font-bold text-secondary">
                              {entry.biggestOdds > 0 ? `+${entry.biggestOdds}` : '—'}
                            </span>
                            {hint && <p className={`text-xs mt-1 ${hint.className}`}>{hint.text}</p>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-primary">
                              {formatPoints(entry.totalPoints)} pts
                            </span>
                          </td>
                        </>
                      )}
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
