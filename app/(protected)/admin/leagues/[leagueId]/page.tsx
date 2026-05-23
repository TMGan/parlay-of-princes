import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/client';
import { getLeagueLeaderboard } from '@/lib/db/league-queries';
import { formatPoints, getWeekNumber } from '@/lib/utils/format';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';
import { ArrowLeft, Crown, Users } from 'lucide-react';

export default async function AdminLeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const admin = await requireAdmin();
  if (!isSuperAdmin(admin.email)) redirect('/admin');

  const { leagueId } = await params;
  const currentWeek = getWeekNumber(new Date());

  const [league, leaderboard] = await Promise.all([
    prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        creator: { select: { id: true, username: true, email: true } },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                totalPoints: true,
                betsWon: true,
                betsLost: true,
              },
            },
          },
          orderBy: { leaguePoints: 'desc' },
        },
      },
    }),
    getLeagueLeaderboard(leagueId),
  ]);

  if (!league) notFound();

  // Get all members' bets for the current week
  const memberIds = league.members.map((m) => m.userId);
  const weeklyBets = await prisma.bet.findMany({
    where: { userId: { in: memberIds }, weekNumber: currentWeek },
    include: { user: { select: { username: true } } },
    orderBy: [{ user: { username: 'asc' } }, { createdAt: 'asc' }],
  });

  // Group bets by user
  const betsByUser: Record<string, typeof weeklyBets> = {};
  for (const bet of weeklyBets) {
    const key = bet.user.username;
    if (!betsByUser[key]) betsByUser[key] = [];
    betsByUser[key].push(bet);
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/admin/leagues" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={14} /> All Leagues
      </Link>

      {/* Header */}
      <div className="card border border-primary/20 space-y-2">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{league.name}</h1>
            {league.description && (
              <p className="text-gray-400 mt-1">{league.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Created by <span className="text-gray-300">{league.creator.username}</span></span>
              <span>•</span>
              <span className="flex items-center gap-1"><Users size={13} /> {league.members.length}/{league.maxMembers} members</span>
              <span>•</span>
              <code className="bg-background px-2 py-0.5 rounded font-mono text-xs text-gray-300">{league.joinCode}</code>
              <span className={`text-xs px-2 py-0.5 rounded-full ${league.isPublic ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                {league.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* League leaderboard */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Crown size={18} className="text-secondary" /> League Leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No bets placed yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => {
                const rank = i + 1;
                return (
                  <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                      rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                      rank === 3 ? 'bg-amber-700/20 text-amber-700' :
                      'bg-background text-gray-500'
                    }`}>
                      {rank === 1 ? '👑' : rank}
                    </div>
                    <Avatar username={entry.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/players/${entry.username}`} className="font-medium text-sm hover:underline">
                        {entry.username}
                      </Link>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-primary font-bold text-sm">{formatPoints(entry.totalPoints)}</p>
                      <p className="text-xs text-gray-500">{entry.betsWon}W / {entry.betsLost}L · {entry.winRate}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Week's picks */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold">Week {currentWeek} Picks</h2>
          {Object.keys(betsByUser).length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No bets placed this week yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {Object.entries(betsByUser).map(([username, bets]) => (
                <div key={username}>
                  <p className="text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Avatar username={username} size="sm" />
                    {username}
                    <span className="text-xs text-gray-500 font-normal">{bets.length} bet{bets.length !== 1 ? 's' : ''}</span>
                  </p>
                  <div className="space-y-1 pl-8">
                    {bets.map((bet) => (
                      <div key={bet.id} className="text-xs flex items-start gap-2 p-2 rounded bg-background">
                        <span className={`shrink-0 px-1.5 py-0.5 rounded font-bold ${
                          bet.status === 'WON' ? 'bg-green-500/10 text-green-400' :
                          bet.status === 'LOST' ? 'bg-red-500/10 text-red-400' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {bet.status === 'PENDING' ? 'PEND' : bet.status}
                        </span>
                        <span className="flex-1 truncate text-gray-300">{bet.description}</span>
                        <span className="text-primary shrink-0 font-semibold">+{bet.oddsLocked}</span>
                        {bet.isKingLock && <span title="King Lock">👑</span>}
                        {bet.isBonusBet && <span title="Bonus">⭐</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All members */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold">Members ({league.members.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-800">
                <th className="pb-3 pr-4">Player</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4 text-right">League Pts</th>
                <th className="pb-3 pr-4 text-right">Global Pts</th>
                <th className="pb-3 text-center">W / L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {league.members.map((m) => (
                <tr key={m.userId} className="hover:bg-background-light transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar username={m.user.username} size="sm" />
                      <Link href={`/players/${m.user.username}`} className="font-medium hover:underline">
                        {m.user.username}
                      </Link>
                      {m.role === 'ADMIN' && (
                        <span className="text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">Admin</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{m.user.email}</td>
                  <td className="py-3 pr-4 text-right font-bold text-primary">
                    {formatPoints(m.leaguePoints)}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-300">
                    {formatPoints(m.user.totalPoints)}
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-green-500">{m.leagueBetsWon}</span>
                    {' / '}
                    <span className="text-red-500">{m.leagueBetsLost}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
