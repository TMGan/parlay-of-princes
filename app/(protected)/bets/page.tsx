import { getCurrentUser } from '@/lib/auth/session';
import { getUserBetsForWeek } from '@/lib/db/queries';
import { getWeekNumber } from '@/lib/utils/format';
import { StructuredBetForm } from '@/components/betting/StructuredBetForm';
import { UserBetsList } from '@/components/betting/UserBetsList';

export default async function BetsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const currentWeek = getWeekNumber(new Date());
  const userBets = await getUserBetsForWeek(user.id, currentWeek);

  const regularBets = userBets.filter((bet) => !bet.isKingLock);
  const kingLock = userBets.find((bet) => bet.isKingLock);

  const canPlaceRegularBet = regularBets.length < 3;
  const canPlaceKingLock = !kingLock;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Place Your Bets
        </h1>
        <p className="text-gray-400 mt-2">
          Week {currentWeek} of 52 • {userBets.length}/4 bets placed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Structured Bet Form */}
        <div className="card lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">New Bet</h2>
          <StructuredBetForm
            userId={user.id}
            currentWeek={currentWeek}
            canPlaceRegularBet={canPlaceRegularBet}
            canPlaceKingLock={canPlaceKingLock}
          />
        </div>

        {/* Current Week Bets */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Your Week {currentWeek} Bets</h2>
          <UserBetsList bets={userBets} />
        </div>
      </div>
    </div>
  );
}
