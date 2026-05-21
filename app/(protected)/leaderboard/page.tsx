import { requireAuth } from '@/lib/auth/session';
import { getLeaderboard } from '@/lib/db/queries';
import { formatPoints } from '@/lib/utils/format';

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-500/20 text-yellow-500',
  2: 'bg-gray-400/20 text-gray-400',
  3: 'bg-amber-700/20 text-amber-700',
};

export default async function LeaderboardPage() {
  const user = await requireAuth();
  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Global Leaderboard
        </h1>
        <p className="text-gray-400 mt-2">{leaderboard.length} players competing</p>
      </div>

      <div className="card overflow-hidden">
        {leaderboard.length === 0 ? (
          <p className="text-center py-12 text-gray-400">No bets placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-light">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-4 w-16">Rank</th>
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4 text-right">Points</th>
                  <th className="px-6 py-4 text-center">W / L</th>
                  <th className="px-6 py-4 text-center hidden sm:table-cell">Win %</th>
                  <th className="px-6 py-4 text-right hidden md:table-cell">Best Hit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const rankStyle = RANK_STYLES[rank] ?? 'bg-background text-gray-500';
                  const isMe = entry.id === user.id;
                  const total = entry.betsWon + entry.betsLost;
                  const winRate = total > 0 ? Math.round((entry.betsWon / total) * 100) : 0;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-background-light transition-colors ${isMe ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${rankStyle}`}>
                          {rank === 1 ? '👑' : rank}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${isMe ? 'text-primary' : ''}`}>
                            {entry.username}
                          </span>
                          {isMe && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">You</span>
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

                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-primary"
                              style={{ width: `${winRate}%` }}
                            />
                          </div>
                          <span className="text-sm w-8 text-right">{winRate}%</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right hidden md:table-cell">
                        <span className="text-secondary font-semibold">
                          {entry.biggestHit > 0 ? `+${formatPoints(entry.biggestHit)}` : '—'}
                        </span>
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
