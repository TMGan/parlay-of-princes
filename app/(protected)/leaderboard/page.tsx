import Link from 'next/link';
import { requireAuth } from '@/lib/auth/session';
import { getUserLeagues } from '@/lib/db/queries';
import { formatPoints } from '@/lib/utils/format';
import { Trophy, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default async function LeaderboardPage() {
  const user = await requireAuth();
  const userLeagues = await getUserLeagues(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Leaderboards
        </h1>
        <p className="text-gray-400 mt-2">
          Points are tracked per league — select one to see the standings.
        </p>
      </div>

      {userLeagues.length === 0 ? (
        <div className="card text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
            <Trophy className="text-gray-600" size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-400">No leagues yet</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Join or create a league to compete on the leaderboard.
          </p>
          <Link href="/leagues/join" className="btn-primary inline-block mt-2">
            Find a League
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {userLeagues.map((membership) => {
            const total = membership.leagueBetsWon + membership.leagueBetsLost;
            const winRate = total > 0 ? Math.round((membership.leagueBetsWon / total) * 100) : 0;
            const memberCount = membership.league._count.members;

            return (
              <Link
                key={membership.league.id}
                href={`/leagues/${membership.league.id}`}
                className="card flex items-center justify-between gap-4 hover:border-primary transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                      {membership.league.name}
                    </h2>
                    {membership.role === 'ADMIN' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={13} />
                      {winRate}% win rate
                    </span>
                  </div>
                </div>

                {/* Your stats in this league */}
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-primary">{formatPoints(membership.leaguePoints)}</p>
                  <p className="text-xs text-gray-400">
                    <span className="text-green-500">{membership.leagueBetsWon}W</span>
                    {' / '}
                    <span className="text-red-500">{membership.leagueBetsLost}L</span>
                  </p>
                </div>

                <ArrowRight size={18} className="text-gray-600 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
