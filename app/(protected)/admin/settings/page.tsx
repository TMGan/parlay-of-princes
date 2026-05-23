import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { getWeekNumber, formatPoints } from '@/lib/utils/format';
import { Users, Trophy, TrendingUp, Star, BarChart2, Zap, Crown } from 'lucide-react';

export default async function AdminStatsPage() {
  await requireAdmin();

  const currentWeek = getWeekNumber(new Date());

  const [
    totalUsers,
    totalBets,
    totalPending,
    totalLeagues,
    totalMessages,
    topUser,
    sportBreakdown,
    weeklyActivity,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.bet.count(),
    prisma.bet.count({ where: { status: 'PENDING' } }),
    prisma.league.count(),
    prisma.message.count(),
    prisma.user.findFirst({
      orderBy: { totalPoints: 'desc' },
      select: { username: true, totalPoints: true, betsWon: true, betsLost: true },
    }),
    // Top 5 sports by bet volume
    prisma.bet.groupBy({
      by: ['sport'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    // Bets per week for the last 8 weeks
    prisma.bet.groupBy({
      by: ['weekNumber'],
      where: { weekNumber: { gte: Math.max(1, currentWeek - 7), lte: currentWeek } },
      _count: { id: true },
      orderBy: { weekNumber: 'asc' },
    }),
    // Last 5 signups
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { username: true, createdAt: true, totalPoints: true },
    }),
  ]);

  const totalResolved = await prisma.bet.count({ where: { status: { in: ['WON', 'LOST'] } } });
  const totalWon = await prisma.bet.count({ where: { status: 'WON' } });
  const siteWinRate = totalResolved > 0 ? Math.round((totalWon / totalResolved) * 100) : 0;

  const statCards = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Bets', value: totalBets.toLocaleString(), icon: Trophy, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Pending Bets', value: totalPending, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Active Leagues', value: totalLeagues, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Site Win Rate', value: `${siteWinRate}%`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Chat Messages', value: totalMessages.toLocaleString(), icon: BarChart2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Platform Stats
        </h1>
        <p className="text-gray-400 mt-2">Week {currentWeek} • Site-wide performance overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-lg ${s.bg} flex-shrink-0`}>
              <s.icon className={s.color} size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top sports */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Star size={18} className="text-secondary" />
            Most Bet Sports
          </h2>
          {sportBreakdown.length === 0 ? (
            <p className="text-gray-500 text-sm">No bets yet.</p>
          ) : (
            <div className="space-y-3">
              {sportBreakdown.map((row, i) => {
                const pct = Math.round((row._count.id / totalBets) * 100);
                return (
                  <div key={row.sport}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">
                        {i === 0 ? '🔥 ' : ''}{row.sport}
                      </span>
                      <span className="text-gray-400">{row._count.id} bets · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly activity */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">Bets per Week (last 8 weeks)</h2>
          {weeklyActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {weeklyActivity.map((row) => {
                const max = Math.max(...weeklyActivity.map((r) => r._count.id));
                const pct = max > 0 ? Math.round((row._count.id / max) * 100) : 0;
                return (
                  <div key={row.weekNumber} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-12 shrink-0">Wk {row.weekNumber}</span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-300 w-8 text-right shrink-0">{row._count.id}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top player */}
        {topUser && (
          <div className="card space-y-3">
            <h2 className="text-lg font-bold">👑 Top Player</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {topUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold">{topUser.username}</p>
                <p className="text-primary font-bold text-lg">{formatPoints(topUser.totalPoints)} pts</p>
                <p className="text-sm text-gray-400">{topUser.betsWon}W / {topUser.betsLost}L</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent signups */}
        <div className="card space-y-3">
          <h2 className="text-lg font-bold">Recent Signups</h2>
          {recentSignups.length === 0 ? (
            <p className="text-gray-500 text-sm">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSignups.map((u) => (
                <div key={u.username} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{u.username}</span>
                  <div className="text-right">
                    <p className="text-primary font-semibold">{formatPoints(u.totalPoints)} pts</p>
                    <p className="text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
