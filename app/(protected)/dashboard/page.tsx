import { getCurrentUser } from "@/lib/auth/session";
import { getUserById, getUserBetsForWeek } from "@/lib/db/queries";
import { getWeekNumber } from "@/lib/utils/format";
import { formatPoints, formatOdds } from "@/lib/utils/format";
import Link from "next/link";
import { TrendingUp, Trophy, Target, Flame } from "lucide-react";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const user = await getUserById(currentUser.id);
  const currentWeek = getWeekNumber(new Date());
  const userBets = await getUserBetsForWeek(currentUser.id, currentWeek);

  if (!user) {
    return <div>User not found</div>;
  }

  const statsCards = [
    {
      title: "Total Points",
      value: formatPoints(user.totalPoints),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Bets Won",
      value: user.betsWon,
      icon: Trophy,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      title: "Win Rate",
      value: user.betsWon + user.betsLost > 0 ? `${Math.round((user.betsWon / (user.betsWon + user.betsLost)) * 100)}%` : "0%",
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "Biggest Hit",
      value: user.biggestHit > 0 ? formatOdds(user.biggestHit) : "—",
      icon: Flame,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Welcome back, {user.username}!
        </h1>
        <p className="text-gray-400 mt-2">Week {currentWeek} of 52 • Ready to make your picks?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <div key={stat.title} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`${stat.color}`} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Week {currentWeek} Bets</h2>
          <span className="text-sm text-gray-400">{userBets.length} / 4 bets placed</span>
        </div>

        {userBets.length === 0 ? (
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
            {userBets.map((bet) => (
              <div
                key={bet.id}
                className="bg-background p-4 rounded-lg border border-gray-800 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded">
                      {bet.sport}
                    </span>
                    {bet.isKingLock && (
                      <span className="text-sm font-semibold text-primary px-2 py-1 bg-primary/10 rounded">
                        👑 KING LOCK
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-medium">{bet.description}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatOdds(bet.oddsLocked)} • {new Date(bet.gameStartTime).toLocaleDateString()}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/bets" className="card hover:border-primary transition-colors cursor-pointer">
          <h3 className="text-lg font-semibold mb-2">Place Bets</h3>
          <p className="text-gray-400 text-sm">Browse available bets and make your picks for this week</p>
        </Link>
        <Link href="/leaderboard" className="card hover:border-secondary transition-colors cursor-pointer">
          <h3 className="text-lg font-semibold mb-2">View Leaderboard</h3>
          <p className="text-gray-400 text-sm">See how you rank against other princes</p>
        </Link>
        <Link href="/profile" className="card hover:border-accent transition-colors cursor-pointer">
          <h3 className="text-lg font-semibold mb-2">Your Stats</h3>
          <p className="text-gray-400 text-sm">View detailed betting history and performance</p>
        </Link>
      </div>
    </div>
  );
}
