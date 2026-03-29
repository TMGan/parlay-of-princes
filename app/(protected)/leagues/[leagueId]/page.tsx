import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import {
  getLeagueWithMembers,
  isLeagueMember,
  isLeagueAdmin,
  getLeagueLeaderboard,
} from '@/lib/db/queries';
import { LeagueOverview } from '@/components/leagues/LeagueOverview';
import { LeagueLeaderboard } from '@/components/leagues/LeagueLeaderboard';
import { LeagueChat } from '@/components/leagues/LeagueChat';
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

  const [league, leaderboard, userIsAdmin] = await Promise.all([
    getLeagueWithMembers(leagueId),
    getLeagueLeaderboard(leagueId),
    isLeagueAdmin(leagueId, user.id),
  ]);

  if (!league) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      <LeagueOverview league={league} currentUserId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LeagueLeaderboard leaderboard={leaderboard} currentUserId={user.id} />
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
