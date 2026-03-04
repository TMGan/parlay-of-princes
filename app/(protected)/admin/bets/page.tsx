import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { BetResolutionForm } from "@/components/admin/BetResolutionForm";
import { HistoricalBetForm } from "@/components/admin/HistoricalBetForm";
import { formatOdds, getWeekNumber } from "@/lib/utils/format";
import { getAllUsersForAdmin } from "@/lib/db/queries";

export default async function AdminBetsPage() {
  await requireAdmin();

  const currentWeek = getWeekNumber(new Date());

  const [pendingBets, allUsers] = await Promise.all([
    prisma.bet.findMany({
      where: {
        status: "PENDING"
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        gameStartTime: "asc"
      }
    }),
    getAllUsersForAdmin()
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Manage Bets
        </h1>
        <p className="text-gray-400 mt-2">
          Week {currentWeek} • Resolve pending bets or add historical entries for past weeks.
        </p>
      </div>

      {pendingBets.length === 0 ? (
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Pending Bets</h2>
          <p className="text-gray-400">
            All bets have been resolved. Check back after users place new bets.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBets.map((bet) => (
            <div key={bet.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded">
                      {bet.sport}
                    </span>
                    <span className="text-sm text-gray-400">Week {bet.weekNumber}</span>
                    {bet.isKingLock && (
                      <span className="text-sm font-semibold text-primary px-2 py-1 bg-primary/10 rounded">
                        👑 KING LOCK
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{bet.description}</h3>
                  <p className="text-sm text-gray-400">
                    {bet.user.username} • {formatOdds(bet.oddsLocked)} •{" "}
                    {new Date(bet.gameStartTime).toLocaleString()}
                  </p>
                </div>
                <BetResolutionForm betId={bet.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card mt-8">
        <h2 className="text-2xl font-bold mb-6">Add Historical Bet</h2>
        <p className="text-gray-400 text-sm mb-6">
          Add bets for past weeks (up to 6 months). Bets are added as PENDING and must be resolved separately.
        </p>
        <HistoricalBetForm users={allUsers} />
      </div>
    </div>
  );
}
