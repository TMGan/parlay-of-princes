import { getLeaderboard } from "@/lib/db/queries"
import { formatPoints } from "@/lib/utils/format"

export default async function PublicLeaderboardPage() {
  const leaderboard = await getLeaderboard()

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-background-light border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Parlay of Princes
            </a>
            <a href="/login" className="text-gray-300 hover:text-white transition-colors">
              Sign In
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  {leaderboard.map((user, index) => {
                    const rank = index + 1
                    const winRate = user.betsWon + user.betsLost > 0 ? Math.round((user.betsWon / (user.betsWon + user.betsLost)) * 100) : 0

                    return (
                      <tr key={user.id} className="hover:bg-background-light transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {rank === 1 && <span className="text-2xl">🏆</span>}
                            {rank === 2 && <span className="text-2xl">🥈</span>}
                            {rank === 3 && <span className="text-2xl">🥉</span>}
                            <span className="font-semibold">{rank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{user.username}</td>
                        <td className="px-6 py-4">
                          <span className="text-primary font-bold">{formatPoints(user.totalPoints)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-500">{user.betsWon}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-red-500">{user.betsLost}</span>
                        </td>
                        <td className="px-6 py-4">{winRate}%</td>
                        <td className="px-6 py-4">
                          <span className="text-secondary font-semibold">{user.biggestHit ? `+${user.biggestHit}` : "—"}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Compete?</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">Join the arena and start building your own royal parlay empire</p>
            <a
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Enter the Arena
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
