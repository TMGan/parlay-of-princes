import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { BetResolutionForm } from '@/components/admin/BetResolutionForm';
import { BetSlipPreview } from '@/components/admin/BetSlipPreview';
import { BulkResolvePanel } from '@/components/admin/BulkResolvePanel';
import { WeekSelector } from '@/components/admin/WeekSelector';
import { ResolveUserFilter } from '@/components/admin/ResolveUserFilter';
import { formatOdds, getWeekNumber, formatDateTimeET } from '@/lib/utils/format';

export default async function AdminResolvePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; user?: string }>;
}) {
  await requireAdmin();

  const { week, user } = await searchParams;
  const currentWeek = getWeekNumber(new Date());
  const selectedWeek = week ? Math.max(1, Math.min(52, Number(week))) : currentWeek;
  const selectedUser = user ?? '';

  const pendingBets = await prisma.bet.findMany({
    where: {
      status: 'PENDING',
      weekNumber: selectedWeek,
      ...(selectedUser
        ? { user: { username: selectedUser } }
        : {}),
    },
    include: { user: { select: { username: true } } },
    orderBy: { gameStartTime: 'asc' },
  });

  // Get all usernames that have pending bets this week (for autocomplete hints)
  const usersWithPending = await prisma.bet.findMany({
    where: { status: 'PENDING', weekNumber: selectedWeek },
    select: { user: { select: { username: true } } },
    distinct: ['userId'],
    orderBy: { user: { username: 'asc' } },
  });
  const usernames = usersWithPending.map((b) => b.user.username);

  const weekOptions = Array.from({ length: currentWeek }, (_, i) => currentWeek - i);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Resolve Bets
          </h1>
          <p className="text-gray-400 mt-2">
            Week {selectedWeek}
            {selectedUser && <> · <span className="text-primary">@{selectedUser}</span></>}
            {' '}· {pendingBets.length} pending
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ResolveUserFilter usernames={usernames} selectedUser={selectedUser} selectedWeek={selectedWeek} />
          <WeekSelector currentWeek={currentWeek} selectedWeek={selectedWeek} weekOptions={weekOptions} />
        </div>
      </div>

      {pendingBets.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">All Clear</h2>
          <p className="text-gray-400">
            {selectedUser
              ? `No pending bets for @${selectedUser} in week ${selectedWeek}.`
              : `No pending bets for week ${selectedWeek}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <BulkResolvePanel bets={pendingBets} />

          <div className="space-y-4">
            {pendingBets.map((bet) => (
              <div key={bet.id} className="card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded">
                        {bet.sport}
                      </span>
                      <span className="text-sm text-gray-400">Wk {bet.weekNumber}</span>
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{bet.description}</h3>
                      {bet.betSlipImage && (
                        <BetSlipPreview imageDataUrl={bet.betSlipImage} username={bet.user.username} />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      @{bet.user.username} · {formatOdds(bet.oddsLocked)} ·{' '}
                      {formatDateTimeET(bet.gameStartTime)}
                    </p>
                  </div>
                  <BetResolutionForm betId={bet.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
