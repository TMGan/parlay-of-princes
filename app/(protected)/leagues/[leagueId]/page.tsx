import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import {
  getLeagueWithMembers,
  isLeagueMember,
  isLeagueAdmin,
  getLeagueLeaderboard,
} from '@/lib/db/queries';
import { getLeagueActivity, getLeagueMemberBetsForWeek } from '@/lib/db/league-queries';
import { getWeekNumber } from '@/lib/utils/format';
import { LeagueActivityFeed } from '@/components/leagues/LeagueActivityFeed';
import { LeagueOverview } from '@/components/leagues/LeagueOverview';
import { LeagueLeaderboard } from '@/components/leagues/LeagueLeaderboard';
import { LeagueWeeklyPicks } from '@/components/leagues/LeagueWeeklyPicks';
import { LeagueChat } from '@/components/leagues/LeagueChat';
import { LeagueAdminPanel } from '@/components/leagues/LeagueAdminPanel';
import { ChatErrorBoundary } from '@/components/error-boundary/ChatErrorBoundary';

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const user = await requireAuth();
  const { leagueId } = await params;

  const isMember = await isLeagueMember(leagueId, user.id);
  if (!isMember) {
    redirect('/leagues/join');
  }

  const currentWeek = getWeekNumber(new Date());

  const [league, leaderboard, userIsAdmin, activities, weeklyPicks] = await Promise.all([
    getLeagueWithMembers(leagueId),
    getLeagueLeaderboard(leagueId),
    isLeagueAdmin(leagueId, user.id),
    getLeagueActivity(leagueId).catch(() => []),
    getLeagueMemberBetsForWeek(leagueId, currentWeek).catch(() => []),
  ]);

  if (!league) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      {userIsAdmin && <LeagueAdminPanel leagueId={leagueId} />}
      <LeagueOverview league={league} currentUserId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <LeagueLeaderboard leaderboard={leaderboard} currentUserId={user.id} />

          {/* Week's picks — everyone's bets in the league */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Week {currentWeek} Picks</h2>
              <p className="text-sm text-gray-400">{weeklyPicks.length} bet{weeklyPicks.length !== 1 ? 's' : ''} placed</p>
            </div>
            <div className="card">
              <LeagueWeeklyPicks
                bets={weeklyPicks}
                currentUserId={user.id}
              />
            </div>
          </div>

          <LeagueActivityFeed activities={activities} />
        </div>

        <div className="lg:col-span-1">
          <ChatErrorBoundary>
            <LeagueChat
              leagueId={leagueId}
              currentUserId={user.id}
              isLeagueAdmin={userIsAdmin}
            />
          </ChatErrorBoundary>
        </div>
      </div>
    </div>
  );
}
