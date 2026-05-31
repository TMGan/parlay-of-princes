import { requireAuth } from '@/lib/auth/session';
import { getActiveBonusBet, getAllBonusBets, getUserClaimForBonusBet } from '@/lib/db/bonus-bet-queries';
import { getUserLeagues } from '@/lib/db/league-queries';
import { formatDateET, formatTimeET } from '@/lib/utils/format';
import { BonusBetClaimButton } from '@/components/betting/BonusBetClaimButton';
import { Crown, Clock, Zap, CalendarDays } from 'lucide-react';

export default async function BonusBetsPage() {
  const user = await requireAuth();

  const [activePick, allPicks, userLeagues] = await Promise.all([
    getActiveBonusBet(),
    getAllBonusBets(),
    getUserLeagues(user.id),
  ]);

  // Scope the claim check to THIS specific bonus pick — not any bonus bet this week.
  // Without this, a prior pick's claim (same week, different bonusBetId) would
  // incorrectly mark the new pick as already claimed.
  const userClaim = activePick
    ? await getUserClaimForBonusBet(user.id, activePick.id)
    : null;

  // Use first league as default context for bonus claim
  const defaultLeagueId = userLeagues[0]?.league.id;

  const claimed = !!userClaim;
  const now = new Date();
  const pastPicks = allPicks.filter(
    (p) => new Date(p.expiryDate) < now && p.id !== activePick?.id
  );

  const expiry = activePick ? new Date(activePick.expiryDate) : null;
  const timeLeft = expiry && !claimed
    ? Math.max(0, Math.round((expiry.getTime() - now.getTime()) / 1000 / 60 / 60))
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Bonus Picks
        </h1>
        <p className="text-gray-400 mt-2">
          Admin drops a themed event — you pick your angle, set your odds, submit your bet.
        </p>
      </div>

      {activePick ? (
        <div className="card border border-secondary/40 bg-gradient-to-br from-secondary/5 to-primary/5 space-y-6">
          {/* Title row */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary/10">
                <Crown className="text-secondary" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-secondary">{activePick.name}</h2>
                  {claimed ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
                      ✓ Submitted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold animate-pulse">
                      <Zap size={11} /> Live Now
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{activePick.sport}</p>
              </div>
            </div>
          </div>

          {/* Description — the event parameters */}
          <div className="bg-background/60 rounded-xl p-4">
            <p className="text-sm text-secondary/80 uppercase tracking-wide font-semibold mb-1">Event Parameters</p>
            <p className="text-base font-medium">{activePick.description}</p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-gray-500" />
              Open until: {formatDateET(activePick.expiryDate, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
              @ {formatTimeET(activePick.expiryDate)}
            </div>
            {timeLeft !== null && !claimed && (
              <div className={`flex items-center gap-1.5 ${timeLeft <= 2 ? 'text-amber-400' : ''}`}>
                <Clock size={14} />
                {timeLeft <= 0 ? 'Closing soon' : timeLeft === 1 ? '~1 hr left' : `~${timeLeft} hrs left`}
              </div>
            )}
          </div>

          {/* Claim form — user supplies their pick, odds, game time */}
          <BonusBetClaimButton
            bonusBetId={activePick.id}
            sport={activePick.sport}
            claimed={claimed}
            claimedBet={userClaim ? {
              status: userClaim.status as 'PENDING' | 'WON' | 'LOST' | 'VOIDED',
              description: userClaim.description,
            } : null}
            leagueId={defaultLeagueId}
          />
        </div>
      ) : (
        <div className="card border border-gray-800 text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
            <Crown className="text-gray-600" size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-400">No Active Bonus Pick</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Check back soon — when the admin drops one, the green dot on the nav will light up!
          </p>
        </div>
      )}

      {/* Past picks */}
      {pastPicks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-300">Past Events</h2>
          <div className="space-y-3">
            {pastPicks.slice(0, 8).map((pick) => (
              <div key={pick.id} className="card flex items-center justify-between gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{pick.name}</p>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{pick.sport}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{pick.description}</p>
                </div>
                <p className="text-xs text-gray-500 shrink-0">
                  {formatDateET(pick.availableDate, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
