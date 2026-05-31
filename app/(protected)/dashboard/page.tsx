import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBetsForWeek, getUserLeagues } from "@/lib/db/queries";
import { getWeekNumber, formatWeekRange, formatPoints, formatOdds, formatDateET } from "@/lib/utils/format";
import Link from "next/link";
import { TrendingUp, Trophy, Target, Flame } from "lucide-react";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const [userLeagues, currentWeekBets] = await Promise.all([
    getUserLeagues(currentUser.id),
    getUserBetsForWeek(currentUser.id, getWeekNumber(new Date())),
  ]);

  if (userLeagues.length === 0) redirect('/leagues/onboarding');

  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const weekRange = formatWeekRange(currentWeek, now);

  // Stats come from the user's most recently joined league
  // (first in list — getUserLeagues orders by joinedAt desc)
  const primaryMembership = userLeagues[0]!;
  const { leaguePoints, leagueBetsWon, leagueBetsLost, leagueBiggestHit } = primaryMembership;
  const totalResolved = leagueBetsWon + leagueBetsLost;
  const winRate = totalResolved > 0 ? Math.round((leagueBetsWon / totalResolved) * 100) : 0;

  const statsCards = [
    {
      title: "League Points",
      value: formatPoints(leaguePoints),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Wins",
      value: leagueBetsWon,
      icon: Trophy,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Win Rate",
      value: `${winRate}%`,
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Best Hit",
      value: leagueBiggestHit > 0 ? `+${formatOdds(leagueBiggestHit)}` : "—",
      icon: Flame,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  // Exclude bonus bets from the week-count display
  const regularBetsThisWeek = currentWeekBets.filter((b) => !b.isBonusBet);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Welcome back, {currentUser.name ?? 'Player'}!
        </h1>
        <p className="text-gray-400 mt-2">
          Week {currentWeek} ({weekRange}) · {primaryMembership.league.name}
        </p>
      </div>

      {/* League stats cards */}
      <div>
        {userLeagues.length > 1 && (
          <p className="text-xs text-gray-500 mb-3">
            Showing stats for <span className="text-gray-300 font-medium">{primaryMembership.league.name}</span>.{' '}
            <Link href="/leagues" className="text-primary hover:underline">Switch league →</Link>
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={stat.color} size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Week's bets */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Week {currentWeek} Bets <span className="text-sm font-normal text-gray-400">({weekRange})</span></h2>
          <span className="text-sm text-gray-400">
            {regularBetsThisWeek.length} / 4 bets placed
          </span>
        </div>

        {currentWeekBets.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">No bets placed yet</h3>
            <p className="text-gray-400 mb-6">Get started by placing your first bet for this week!</p>
            <Link href="/bets" className="btn-primary inline-block">
              Place Your Bets
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {currentWeekBets.map((bet) => (
              <div
                key={bet.id}
                className="bg-background p-4 rounded-lg border border-gray-800 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded">
                      {bet.sport}
                    </span>
                    {bet.isKingLock && (
                      <span className="text-sm font-semibold text-primary px-2 py-1 bg-primary/10 rounded">
                        👑 KING LOCK
                      </span>
                    )}
                    {bet.isBonusBet && (
                      <span className="text-sm font-semibold text-amber-400 px-2 py-1 bg-amber-400/10 rounded">
                        ⭐ BONUS
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-medium">{bet.description}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatOdds(bet.oddsLocked)} · {formatDateET(bet.gameStartTime)}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-semibold px-3 py-1 rounded ${
                      bet.status === "WON"
                        ? "bg-green-500/10 text-green-500"
                        : bet.status === "LOST"
                          ? "bg-red-500/10 text-red-500"
                          : bet.status === "VOIDED"
                            ? "bg-gray-500/10 text-gray-500"
                            : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {bet.status}
                  </div>
                  {bet.pointsAwarded !== null && (
                    <p className="text-sm text-gray-400 mt-1">+{formatPoints(bet.pointsAwarded)} pts</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/bets" className="card hover:border-primary transition-colors cursor-pointer">
          <h3 className="text-lg font-semibold mb-2">Place Bets</h3>
          <p className="text-gray-400 text-sm">Browse available bets and make your picks for this week</p>
        </Link>
        <Link href="/profile" className="card hover:border-accent transition-colors cursor-pointer">
          <h3 className="text-lg font-semibold mb-2">Your Stats</h3>
          <p className="text-gray-400 text-sm">View detailed betting history and per-league performance</p>
        </Link>
      </div>
    </div>
  );
}
