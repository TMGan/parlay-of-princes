import { formatOdds } from "@/lib/utils/format";
import { DeleteBetButton } from "./DeleteBetButton";

interface Bet {
  id: string;
  sport: string;
  description: string;
  oddsLocked: number;
  isKingLock: boolean;
  status: string;
  gameStartTime: Date;
  pointsAwarded: number | null;
}

export function UserBetsList({ bets }: { bets: Bet[] }) {
  if (bets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No bets placed yet for this week.</p>
        <p className="text-sm mt-2">Use the form to place your first bet!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map((bet) => (
        <div
          key={bet.id}
          className="bg-background p-4 rounded-lg border border-gray-800 flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded">
                {bet.sport}
              </span>
              {bet.isKingLock && (
                <span className="text-sm font-semibold text-primary px-2 py-1 bg-primary/10 rounded">
                  👑 KING LOCK
                </span>
              )}
              <span
                className={`text-sm font-semibold px-2 py-1 rounded ${
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
              </span>
            </div>
            <p className="font-medium mb-1">{bet.description}</p>
            <p className="text-sm text-gray-400">
              {formatOdds(bet.oddsLocked)} • {new Date(bet.gameStartTime).toLocaleString()}
            </p>
            {bet.pointsAwarded !== null && (
              <p className="text-sm text-green-500 mt-1">+{bet.pointsAwarded} points</p>
            )}
          </div>
          {bet.status === "PENDING" && <DeleteBetButton betId={bet.id} />}
        </div>
      ))}
    </div>
  );
}
