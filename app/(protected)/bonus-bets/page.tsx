import { requireAuth } from '@/lib/auth/session';
import {
  getActiveBonusBet,
  getAllBonusBets,
  getUserBonusBetForWeek,
} from '@/lib/db/bonus-bet-queries';
import { getWeekNumber } from '@/lib/utils/format';
import { BonusBetClaimButton } from '@/components/betting/BonusBetClaimButton';
import { Crown, Clock, Zap, CheckCircle2, CalendarDays } from 'lucide-react';

export default async function BonusBetsPage() {
  const user = await requireAuth();
  const currentWeek = getWeekNumber(new Date());

  const [activePick, allPicks, userClaim] = await Promise.all([
    getActiveBonusBet(),
    getAllBonusBets(),
    getActiveBonusBet().then((pick) =>
      pick ? getUserBonusBetForWeek(user.id, currentWeek) : null
    ),
  ]);

  const claimed = !!userClaim;
  const now = new Date();
  const pastPicks = allPicks.filter(
    (p) => new Date(p.expiryDate) < now && p.id !== activePick?.id
  );

  const gameStart = activePick
    ? new Date(activePick.parameters.gameStartTime)
    : null;
  const expiry = activePick ? new Date(activePick.expiryDate) : null;
  const timeLeft =
    expiry && !claimed
      ? Math.max(0, Math.round((expiry.getTime() - now.getTime()) / 1000 / 60 / 60))
      : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Bonus Picks
        </h1>
        <p className="text-gray-400 mt-2">
          The admin drops a special pick — you decide whether to take it.
        </p>
      </div>

      {/* Active pick hero card */}
      {activePick ? (
        <div className="card border border-secondary/40 bg-gradient-to-br from-secondary/5 to-primary/5 space-y-6">
          {/* Title row */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Crown className="text-secondary" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-secondary">{activePick.name}</h2>
                  {claimed ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
                      <CheckCircle2 size={11} /> Claimed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold animate-pulse">
                      <Zap size={11} /> Live Now
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{activePick.parameters.sport}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black text-primary">
                +{activePick.parameters.oddsAmerican}
              </div>
              <p className="text-xs text-gray-500">American odds</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-background/60 rounded-lg p-4">
            <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-1">
              The Pick
            </p>
            <p className="text-base font-medium">{activePick.description}</p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {gameStart && (
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-gray-500" />
                Game: {gameStart.toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}{' '}
                @ {gameStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
            )}
            {timeLeft !== null && !claimed && (
              <div className={`flex items-center gap-1.5 ${timeLeft <= 2 ? 'text-amber-400' : ''}`}>
                <Clock size={14} />
                {timeLeft <= 0
                  ? 'Closing soon'
                  : timeLeft === 1
                  ? '~1 hour left to claim'
                  : `~${timeLeft} hours left to claim`}
              </div>
            )}
          </div>

          {/* Claim button — client component */}
          <BonusBetClaimButton
            bonusBetId={activePick.id}
            claimed={claimed}
            claimedStatus={userClaim?.status ?? null}
          />
        </div>
      ) : (
        <div className="card border border-gray-800 text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
            <Crown className="text-gray-600" size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-400">No Active Bonus Pick</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            The admin hasn&apos;t dropped one yet — keep an eye on this page and the nav for the green dot!
          </p>
        </div>
      )}

      {/* Past picks */}
      {pastPicks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-300">Past Picks</h2>
          <div className="space-y-3">
            {pastPicks.slice(0, 8).map((pick) => (
              <div
                key={pick.id}
                className="card flex items-center justify-between gap-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{pick.name}</p>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                      {pick.parameters.sport}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{pick.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">+{pick.parameters.oddsAmerican}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(pick.availableDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
