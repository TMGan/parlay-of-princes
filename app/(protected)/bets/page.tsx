import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserBetsForWeek, getUserLeagues } from '@/lib/db/queries';
import { getWeekNumber } from '@/lib/utils/format';
import { StructuredBetForm } from '@/components/betting/StructuredBetForm';
import { ManualBetForm } from '@/components/betting/ManualBetForm';
import { UserBetsList } from '@/components/betting/UserBetsList';

export default async function BetsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const userLeagues = await getUserLeagues(user.id);
  if (userLeagues.length === 0) {
    redirect('/leagues/onboarding');
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
        {/* Bet Entry Forms */}
        <div className="card lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">New Bet</h2>
            
            {/* Structured Bet Flow */}
            <StructuredBetForm
              userId={user.id}
              currentWeek={currentWeek}
              canPlaceRegularBet={canPlaceRegularBet}
              canPlaceKingLock={canPlaceKingLock}
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-light text-gray-400">OR</span>
            </div>
          </div>

          {/* Manual Bet Entry */}
          <div>
            <ManualBetForm
              userId={user.id}
              currentWeek={currentWeek}
              canPlaceRegularBet={canPlaceRegularBet}
              canPlaceKingLock={canPlaceKingLock}
            />
          </div>
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
