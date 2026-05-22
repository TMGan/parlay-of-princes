interface Bet {
  status: string;
  isKingLock: boolean;
  isBonusBet: boolean;
  oddsLocked: number;
  pointsAwarded: number | null;
  sport: string;
}

export interface Badge {
  emoji: string;
  label: string;
  description: string;
  color: string;
}

export function calculateBadges(bets: Bet[], totalPoints: number, betsWon: number, betsLost: number): Badge[] {
  const badges: Badge[] = [];
  const resolved = bets.filter((b) => b.status === 'WON' || b.status === 'LOST');
  const won = bets.filter((b) => b.status === 'WON');
  const total = betsWon + betsLost;
  const winRate = total > 0 ? betsWon / total : 0;

  // Win rate badges
  if (total >= 10 && winRate >= 0.7) badges.push({ emoji: '🔥', label: 'Elite Picker', description: '70%+ win rate (min 10 bets)', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' });
  else if (total >= 10 && winRate >= 0.6) badges.push({ emoji: '📈', label: 'Sharp Eye', description: '60%+ win rate (min 10 bets)', color: 'text-green-400 border-green-400/30 bg-green-400/10' });

  // Points milestones
  if (totalPoints >= 10000) badges.push({ emoji: '💎', label: 'Diamond Hands', description: '10,000+ total points', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' });
  else if (totalPoints >= 5000) badges.push({ emoji: '🏆', label: 'High Roller', description: '5,000+ total points', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' });
  else if (totalPoints >= 1000) badges.push({ emoji: '⭐', label: 'Rising Star', description: '1,000+ total points', color: 'text-purple-400 border-purple-400/30 bg-purple-400/10' });

  // King Lock fanatic
  const kingLocks = resolved.filter((b) => b.isKingLock);
  const kingLockWins = kingLocks.filter((b) => b.status === 'WON');
  if (kingLocks.length >= 5 && kingLockWins.length / kingLocks.length >= 0.6) {
    badges.push({ emoji: '👑', label: 'King of Locks', description: 'High win rate on King Locks', color: 'text-primary border-primary/30 bg-primary/10' });
  }

  // Underdog hunter (avg odds > +250 on wins)
  if (won.length >= 5) {
    const avgWinOdds = won.reduce((s, b) => s + b.oddsLocked, 0) / won.length;
    if (avgWinOdds >= 250) badges.push({ emoji: '🎯', label: 'Underdog Hunter', description: 'Wins big underdogs consistently', color: 'text-rose-400 border-rose-400/30 bg-rose-400/10' });
  }

  // Win streak
  let streak = 0;
  let maxStreak = 0;
  for (const b of [...resolved].reverse()) {
    if (b.status === 'WON') { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 0;
  }
  if (maxStreak >= 7) badges.push({ emoji: '⚡', label: 'On Fire', description: '7+ win streak', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' });
  else if (maxStreak >= 5) badges.push({ emoji: '🌶️', label: 'Hot Streak', description: '5+ win streak', color: 'text-red-400 border-red-400/30 bg-red-400/10' });

  // Sport diversity
  const sports = new Set(resolved.map((b) => b.sport));
  if (sports.size >= 5) badges.push({ emoji: '🌍', label: 'All-Sport', description: 'Bets across 5+ sports', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' });

  // Bonus bet claimer
  const bonusWins = won.filter((b) => b.isBonusBet);
  if (bonusWins.length >= 3) badges.push({ emoji: '💰', label: 'Bonus Bagger', description: 'Won 3+ bonus picks', color: 'text-secondary border-secondary/30 bg-secondary/10' });

  // Volume
  if (total >= 50) badges.push({ emoji: '📊', label: 'Veteran', description: '50+ resolved bets', color: 'text-gray-400 border-gray-400/30 bg-gray-400/10' });
  else if (total >= 20) badges.push({ emoji: '💪', label: 'Grinder', description: '20+ resolved bets', color: 'text-gray-400 border-gray-400/30 bg-gray-400/10' });

  return badges;
}

export function getCurrentStreak(bets: Bet[]): { count: number; type: 'W' | 'L' | null } {
  const resolved = bets.filter((b) => b.status === 'WON' || b.status === 'LOST');
  if (resolved.length === 0) return { count: 0, type: null };

  const first = resolved[0]!.status;
  let count = 0;
  for (const b of resolved) {
    if (b.status === first) count++;
    else break;
  }
  return { count, type: first === 'WON' ? 'W' : 'L' };
}

export function getHotSport(bets: Bet[]): string | null {
  const won = bets.filter((b) => b.status === 'WON');
  if (won.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const b of won) counts[b.sport] = (counts[b.sport] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
