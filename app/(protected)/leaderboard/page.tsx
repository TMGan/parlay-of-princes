import { getLeaderboard } from "@/lib/db/queries";
import { formatPoints, formatOdds } from "@/lib/utils/format";
import { Trophy, Medal, Award } from "lucide-react";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-gray-400 mt-2">See who's ruling the arena</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-light">
              <tr className="text-left text-gray-400 text-sm">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Total Points</th>
                <th className="px-6 py-4">Bets Won</th>
                <th className="px-6 py-4">Bets Lost</th>
                <th className="px-6 py-4">Win Rate</th>
                <th className="px-6 py-4">Biggest Hit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {leaderboard.map((entry, index) => {
                const winRate = entry.betsWon + entry.betsLost > 0 ? Math.round((entry.betsWon / (entry.betsWon + entry.betsLost)) * 100) : 0;

                return (
                  <tr key={entry.id} className="hover:bg-background-light transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {index === 0 && <Trophy className="text-secondary" size={20} />}
                        {index === 1 && <Medal className="text-gray-400" size={20} />}
                        {index === 2 && <Award className="text-amber-700" size={20} />}
                        <span className="font-semibold">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{entry.username}</td>
                    <td className="px-6 py-4">
                      <span className="text-primary font-bold">{formatPoints(entry.totalPoints)}</span>
                    </td>
                    <td className="px-6 py-4 text-green-500">{entry.betsWon}</td>
                    <td className="px-6 py-4 text-red-500">{entry.betsLost}</td>
                    <td className="px-6 py-4">{winRate}%</td>
                    <td className="px-6 py-4 text-secondary font-semibold">
                      {entry.biggestHit > 0 ? formatOdds(entry.biggestHit) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
