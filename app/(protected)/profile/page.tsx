import { getCurrentUser } from "@/lib/auth/session";
import { getUserById, getAllUserBets, getUserLeagues } from "@/lib/db/queries";
import { formatPoints, formatDateET } from "@/lib/utils/format";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { BetHistory } from "@/components/profile/BetHistory";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { TrendingUp, Trophy, Flame } from "lucide-react";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const [user, allBets, userLeagues] = await Promise.all([
    getUserById(currentUser.id),
    getAllUserBets(currentUser.id),
    getUserLeagues(currentUser.id),
  ]);

  if (!user) return <div>User not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-6 flex-wrap">
        <AvatarUpload username={user.username} currentAvatarUrl={user.avatarUrl ?? null} />
        <div className="pt-1">
          <h1 className="text-3xl font-bold">{user.username}</h1>
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {user.role === 'ADMIN' ? '👑 Admin' : 'Member'} · Joined {formatDateET(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Per-league stats */}
      {userLeagues.length > 0 ? (
        <div className="card space-y-4">
          <h2 className="text-xl font-bold">League Stats</h2>
          <div className="space-y-3">
            {userLeagues.map((membership) => {
              const total = membership.leagueBetsWon + membership.leagueBetsLost;
              const winRate = total > 0 ? Math.round((membership.leagueBetsWon / total) * 100) : 0;
              return (
                <div
                  key={membership.league.id}
                  className="bg-background rounded-xl p-4 border border-gray-800"
                >
                  <p className="text-sm font-semibold text-gray-300 mb-3">{membership.league.name}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="text-primary" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Points</p>
                        <p className="font-bold text-primary">{formatPoints(membership.leaguePoints)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Trophy className="text-green-500" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">W / L</p>
                        <p className="font-bold">
                          <span className="text-green-500">{membership.leagueBetsWon}</span>
                          <span className="text-gray-500 mx-1">/</span>
                          <span className="text-red-500">{membership.leagueBetsLost}</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-primary rounded-full"
                            style={{ width: `${winRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-8 text-right">{winRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-400/10">
                        <Flame className="text-amber-400" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Best Hit</p>
                        <p className="font-bold text-amber-400">
                          {membership.leagueBiggestHit > 0 ? `+${membership.leagueBiggestHit}` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-400">
          <p>Join a league to see your stats here.</p>
        </div>
      )}

      {/* Settings + Account Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileEditForm currentUsername={user.username} />

        <div className="card space-y-3">
          <h2 className="text-xl font-bold">Account Info</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Username', value: `@${user.username}` },
              { label: 'Email', value: user.email },
              { label: 'Role', value: user.role === 'ADMIN' ? '👑 Admin' : 'Member' },
              { label: 'Member since', value: formatDateET(user.createdAt) },
              { label: 'Total bets placed', value: allBets.length },
              { label: 'Leagues', value: userLeagues.length },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-gray-400">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BetHistory bets={allBets} />
    </div>
  );
}
