import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserBetsForWeek, getUserLeagues } from '@/lib/db/queries';
import { getWeekNumber } from '@/lib/utils/format';
import { StructuredBetForm } from '@/components/betting/StructuredBetForm';
import { ManualBetForm } from '@/components/betting/ManualBetForm';
import { UserBetsList } from '@/components/betting/UserBetsList';

export default async function BetsPage({
  searchParams,
}: {
  searchParams: Promise<{ leagueId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const userLeagues = await getUserLeagues(user.id);
  if (userLeagues.length === 0) redirect('/leagues/onboarding');

  const { leagueId: paramLeagueId } = await searchParams;

  // Determine active league — URL param first, then default to first
  const activeLeagueMembership =
    (paramLeagueId ? userLeagues.find((m) => m.league.id === paramLeagueId) : null) ??
    userLeagues[0]!;

  const leagueId = activeLeagueMembership.league.id;
  const currentWeek = getWeekNumber(new Date());

  // Bets are now per-league
  const userBets = await getUserBetsForWeek(user.id, currentWeek, leagueId);
  const regularBets = userBets.filter((bet) => !bet.isKingLock && !bet.isBonusBet);
  const kingLock = userBets.find((bet) => bet.isKingLock);

  const canPlaceRegularBet = regularBets.length < 3;
  const canPlaceKingLock = !kingLock;

  return (
    <div className="space-y-6">
      {/* League tabs — only show if in multiple leagues */}
      {userLeagues.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {userLeagues.map((m) => (
            <Link
              key={m.league.id}
              href={`/bets?leagueId=${m.league.id}`}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                m.league.id === leagueId
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              {m.league.name}
            </Link>
          ))}
        </div>
      )}

      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Place Your Bets
        </h1>
        <p className="text-gray-400 mt-2">
          {activeLeagueMembership.league.name} · Week {currentWeek} · {userBets.length}/4 bets placed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bet Entry Forms */}
        <div className="card lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">New Bet</h2>
            <StructuredBetForm
              userId={user.id}
              currentWeek={currentWeek}
              leagueId={leagueId}
              canPlaceRegularBet={canPlaceRegularBet}
              canPlaceKingLock={canPlaceKingLock}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-light text-gray-400">OR</span>
            </div>
          </div>

          <ManualBetForm
            userId={user.id}
            currentWeek={currentWeek}
            leagueId={leagueId}
            canPlaceRegularBet={canPlaceRegularBet}
            canPlaceKingLock={canPlaceKingLock}
          />

          <div className="pt-2 border-t border-gray-800">
            <Link
              href="/bonus-bets"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full border border-secondary/40 text-sm text-secondary hover:bg-secondary/10 transition-all font-medium"
            >
              ⭐ View Bonus Pick
            </Link>
          </div>
        </div>

        {/* Current Week Bets */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            {activeLeagueMembership.league.name} · Week {currentWeek} Bets
          </h2>
          <UserBetsList bets={userBets} />
        </div>
      </div>
    </div>
  );
}
