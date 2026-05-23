import { getCurrentUser } from "@/lib/auth/session";
import { getUserById, getAllUserBets } from "@/lib/db/queries";
import { formatPoints } from "@/lib/utils/format";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { BetHistory } from "@/components/profile/BetHistory";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { TrendingUp, Trophy, Target, Flame } from "lucide-react";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const [user, allBets] = await Promise.all([
    getUserById(currentUser.id),
    getAllUserBets(currentUser.id),
  ]);

  if (!user) return <div>User not found</div>;

  const winRate =
    user.betsWon + user.betsLost > 0
      ? Math.round((user.betsWon / (user.betsWon + user.betsLost)) * 100)
      : 0;

  const stats = [
    { label: 'Total Points', value: formatPoints(user.totalPoints), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Bets Won', value: user.betsWon, icon: Trophy, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Biggest Hit', value: user.biggestHit > 0 ? formatPoints(user.biggestHit) : '—', icon: Flame, color: 'text-secondary', bg: 'bg-secondary/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-6 flex-wrap">
        <AvatarUpload username={user.username} currentAvatarUrl={user.avatarUrl ?? null} />
        <div className="pt-1">
          <h1 className="text-3xl font-bold">{user.username}</h1>
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {user.role === 'ADMIN' ? '👑 Admin' : 'Member'} · Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${s.bg}`}>
              <s.icon className={s.color} size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Settings + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileEditForm currentUsername={user.username} />

        <div className="card space-y-3">
          <h2 className="text-xl font-bold">Account Info</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Username', value: `@${user.username}` },
              { label: 'Email', value: user.email },
              { label: 'Role', value: user.role === 'ADMIN' ? '👑 Admin' : 'Member' },
              { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString() },
              { label: 'Total bets', value: allBets.length },
              { label: 'Bets lost', value: user.betsLost },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0 last:pb-0">
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
