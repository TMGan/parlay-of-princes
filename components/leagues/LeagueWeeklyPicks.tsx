import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Crown, Star } from 'lucide-react';

type Bet = {
  id: string;
  description: string;
  sport: string;
  oddsLocked: number;
  status: string;
  isKingLock: boolean;
  isBonusBet: boolean;
  gameStartTime: Date;
  user: { id: string; username: string };
};

interface Props {
  bets: Bet[];
  currentUserId: string;
}

const STATUS_STYLE: Record<string, string> = {
  WON:    'bg-green-500/10 text-green-400 border-green-500/20',
  LOST:   'bg-red-500/10 text-red-400 border-red-500/20',
  VOIDED: 'bg-gray-700/50 text-gray-400 border-gray-600/20',
  PENDING:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export function LeagueWeeklyPicks({ bets, currentUserId }: Props) {
  // Group bets by username
  const byUser: Record<string, { username: string; userId: string; bets: Bet[] }> = {};
  for (const bet of bets) {
    const key = bet.user.username;
    if (!byUser[key]) byUser[key] = { username: bet.user.username, userId: bet.user.id, bets: [] };
    byUser[key].bets.push(bet);
  }

  const users = Object.values(byUser).sort((a, b) => {
    // Current user first
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return a.username.localeCompare(b.username);
  });

  if (users.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-sm">No bets placed yet this week. Be first! 🎯</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {users.map(({ username, userId, bets: userBets }) => {
        const isMe = userId === currentUserId;
        const won = userBets.filter((b) => b.status === 'WON').length;
        const lost = userBets.filter((b) => b.status === 'LOST').length;
        const pending = userBets.filter((b) => b.status === 'PENDING').length;

        return (
          <div key={username} className={`rounded-lg border p-4 space-y-3 ${isMe ? 'border-primary/30 bg-primary/5' : 'border-gray-800 bg-background'}`}>
            {/* User header */}
            <div className="flex items-center gap-3">
              <Avatar username={username} size="sm" />
              <div className="flex-1 min-w-0">
                <Link
                  href={isMe ? '/profile' : `/players/${username}`}
                  className="font-semibold text-sm hover:underline"
                >
                  {username}
                  {isMe && <span className="ml-2 text-xs text-primary font-normal">(You)</span>}
                </Link>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{userBets.length} bet{userBets.length !== 1 ? 's' : ''}</span>
                  {won > 0 && <span className="text-green-400">{won}W</span>}
                  {lost > 0 && <span className="text-red-400">{lost}L</span>}
                  {pending > 0 && <span className="text-yellow-400">{pending} pending</span>}
                </div>
              </div>
            </div>

            {/* Bet list */}
            <div className="space-y-1.5">
              {userBets.map((bet) => (
                <div key={bet.id} className="flex items-start gap-2 text-sm">
                  {/* Status badge */}
                  <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-semibold mt-0.5 ${STATUS_STYLE[bet.status] ?? STATUS_STYLE.PENDING}`}>
                    {bet.status === 'PENDING' ? 'PEND' : bet.status}
                  </span>

                  {/* Description */}
                  <span className="flex-1 text-gray-300 leading-snug">{bet.description}</span>

                  {/* Badges + odds */}
                  <div className="flex items-center gap-1 shrink-0">
                    {bet.isKingLock && <span title="King Lock"><Crown size={13} className="text-primary" /></span>}
                    {bet.isBonusBet && <span title="Bonus Pick"><Star size={13} className="text-amber-400" /></span>}
                    <span className="text-xs text-gray-400 font-mono">+{bet.oddsLocked}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
