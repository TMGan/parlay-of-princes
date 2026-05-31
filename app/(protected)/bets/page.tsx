import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserBetsForWeek, getUserLeagues } from '@/lib/db/queries';
import { getActiveBonusBets, getUserClaimForBonusBet } from '@/lib/db/bonus-bet-queries';
import { getWeekNumber, formatWeekRange } from '@/lib/utils/format';
import { StructuredBetForm } from '@/components/betting/StructuredBetForm';
import { ManualBetForm } from '@/components/betting/ManualBetForm';
import { UserBetsList } from '@/components/betting/UserBetsList';
import { InlineBonusPicks } from '@/components/betting/InlineBonusPicks';

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
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const weekRange = formatWeekRange(currentWeek, now);

  // Fetch bets and active bonus picks in parallel
  const [userBets, activeBonusBets] = await Promise.all([
    getUserBetsForWeek(user.id, currentWeek, leagueId),
    getActiveBonusBets(),
  ]);

  // Separate bet types
  const regularBets = userBets.filter((bet) => !bet.isKingLock && !bet.isBonusBet);
  const kingLock = userBets.find((bet) => bet.isKingLock);
  const bonusBets = userBets.filter((bet) => bet.isBonusBet);

  // Regular slots: 3 regular + 1 king lock = 4 total (bonus picks are separate)
  const canPlaceRegularBet = regularBets.length < 3;
  const canPlaceKingLock = !kingLock;
  const regularSlotsFilled = regularBets.length + (kingLock ? 1 : 0);

  // Filter active bonus bets to only those the user hasn't claimed yet
  const claimStatuses = await Promise.all(
    activeBonusBets.map((b) => getUserClaimForBonusBet(user.id, b.id))
  );
  const unclaimedBonusPicks = activeBonusBets
    .filter((_, i) => claimStatuses[i] === null)
    .map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      sport: b.sport,
      expiryDate: b.expiryDate.toISOString(),
    }));

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
          {activeLeagueMembership.league.name} · Week {currentWeek} ({weekRange}) · {regularSlotsFilled}/4 bets placed
          {bonusBets.length > 0 && (
            <span className="text-secondary ml-2">· {bonusBets.length} bonus</span>
          )}
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

          {/* Inline bonus picks — only rendered when there are unclaimed active picks */}
          {unclaimedBonusPicks.length > 0 && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background-light text-gray-400">BONUS</span>
                </div>
              </div>
              <InlineBonusPicks picks={unclaimedBonusPicks} leagueId={leagueId} />
            </>
          )}
        </div>

        {/* Current Week Bets */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            {activeLeagueMembership.league.name} · Week {currentWeek} Bets <span className="text-sm font-normal text-gray-400">({weekRange})</span>
          </h2>
          <UserBetsList bets={userBets} />
        </div>
      </div>
    </div>
  );
}
