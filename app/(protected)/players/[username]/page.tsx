import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { getPublicProfile } from '@/lib/db/queries';
import { Avatar } from '@/components/ui/Avatar';
import { calculateBadges, getCurrentStreak, getHotSport } from '@/lib/utils/badges';
import { formatPoints } from '@/lib/utils/format';
import { Trophy, TrendingUp, Target, Flame, Zap, Star } from 'lucide-react';

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const viewer = await requireAuth();
  const { username } = await params;

  // Redirect to own profile page if viewing yourself
  if (viewer.username === username) redirect('/profile');

  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const resolvedBets = profile.bets.filter(
    (b) => b.status === 'WON' || b.status === 'LOST'
  );
  const total = profile.betsWon + profile.betsLost;
  const winRate = total > 0 ? Math.round((profile.betsWon / total) * 100) : 0;
  const streak = getCurrentStreak(resolvedBets);
  const hotSport = getHotSport(resolvedBets);
  const badges = calculateBadges(profile.bets, profile.totalPoints, profile.betsWon, profile.betsLost);

  // Show all leagues the target is in (public info — just names, no join codes)
  const leagues = profile.leagueMemberships;

  // Sport breakdown
  const sportBreakdown: Record<string, { won: number; lost: number }> = {};
  for (const bet of resolvedBets) {
    if (!sportBreakdown[bet.sport]) sportBreakdown[bet.sport] = { won: 0, lost: 0 };
    const entry = sportBreakdown[bet.sport]!;
    if (bet.status === 'WON') entry.won++;
    else entry.lost++;
  }
  const topSports = Object.entries(sportBreakdown)
    .sort((a, b) => (b[1].won + b[1].lost) - (a[1].won + a[1].lost))
    .slice(0, 4);

  const recentBets = resolvedBets.slice(0, 10);

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="card flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar username={profile.username} size="xl" />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            {profile.role === 'ADMIN' && (
              <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded-full font-semibold">
                👑 Admin
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">Member since {memberSince}</p>
          <p className="text-gray-500 text-xs mt-0.5">{total} bets resolved · {leagues.length} league{leagues.length !== 1 ? 's' : ''}</p>

          {/* Streak pill */}
          {streak.type && streak.count >= 2 && (
            <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-sm font-semibold border ${
              streak.type === 'W'
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              <Zap size={13} />
              {streak.count}-{streak.type === 'W' ? 'Win' : 'Loss'} Streak
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Points', value: formatPoints(profile.totalPoints), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Bets Won', value: profile.betsWon, icon: Trophy, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Biggest Hit', value: profile.biggestHit > 0 ? `+${formatPoints(profile.biggestHit)}` : '—', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${s.bg} flex-shrink-0`}>
              <s.icon className={s.color} size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badges */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Star size={18} className="text-secondary" />
            Badges
          </h2>
          {badges.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No badges yet — keep playing!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${badge.color}`}
                  title={badge.description}
                >
                  <span>{badge.emoji}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sport breakdown */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">
            Sport Breakdown
            {hotSport && <span className="text-sm font-normal text-gray-400 ml-2">🔥 Hottest: {hotSport}</span>}
          </h2>
          {topSports.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No resolved bets yet.</p>
          ) : (
            <div className="space-y-3">
              {topSports.map(([sport, { won, lost }]) => {
                const sportTotal = won + lost;
                const pct = Math.round((won / sportTotal) * 100);
                return (
                  <div key={sport}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{sport}</span>
                      <span className="text-gray-400">{won}W / {lost}L · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leagues */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">Leagues</h2>
          {leagues.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Not in any leagues.</p>
          ) : (
            <div className="space-y-2">
              {leagues.map((m) => (
                <div key={m.leagueId} className="flex items-center justify-between p-3 rounded-lg bg-background border border-gray-800">
                  <span className="font-medium text-sm">{m.league.name}</span>
                  <div className="flex items-center gap-2">
                    {m.role === 'ADMIN' && (
                      <span className="text-xs text-secondary">Admin</span>
                    )}
                    <span className="text-xs text-gray-500">
                      +{formatPoints(m.leaguePoints)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* W/L breakdown */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">Record</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Wins</span>
              <span className="text-2xl font-bold text-green-500">{profile.betsWon}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Losses</span>
              <span className="text-2xl font-bold text-red-500">{profile.betsLost}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-800 pt-4">
              <span className="text-gray-400">Win Rate</span>
              <span className="text-2xl font-bold">{winRate}%</span>
            </div>
            {/* Win rate bar */}
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-primary rounded-full transition-all"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent bets */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold">Recent Bets</h2>
        {recentBets.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">No resolved bets yet.</p>
        ) : (
          <div className="space-y-2">
            {recentBets.map((bet) => (
              <div key={bet.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-background border border-gray-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-secondary px-1.5 py-0.5 bg-secondary/10 rounded">
                      {bet.sport}
                    </span>
                    {bet.isKingLock && <span className="text-xs text-primary">👑</span>}
                    {bet.isBonusBet && <span className="text-xs text-amber-400">⭐</span>}
                    <span className="text-xs text-gray-500">Wk {bet.weekNumber}</span>
                  </div>
                  <p className="text-sm truncate">{bet.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    bet.status === 'WON' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {bet.status}
                  </span>
                  {bet.pointsAwarded !== null && bet.pointsAwarded > 0 && (
                    <p className="text-xs text-green-500 mt-1">+{bet.pointsAwarded} pts</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
