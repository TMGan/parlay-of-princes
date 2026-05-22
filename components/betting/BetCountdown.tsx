'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function getTimeLeft(gameStartTime: Date) {
  const diff = new Date(gameStartTime).getTime() - Date.now();
  if (diff <= 0) return null;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  if (h > 48) return null; // don't show for far-future games
  if (h >= 1) return `${h}h ${m}m`;
  if (m >= 1) return `${m}m ${s}s`;
  return `${s}s`;
}

export function BetCountdown({ gameStartTime }: { gameStartTime: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(gameStartTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(gameStartTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStartTime]);

  if (!timeLeft) return null;

  const diff = new Date(gameStartTime).getTime() - Date.now();
  const isUrgent = diff < 3600000; // under 1 hour

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
        isUrgent
          ? 'bg-amber-500/15 text-amber-400'
          : 'bg-gray-700/60 text-gray-400'
      }`}
    >
      <Clock size={11} />
      {timeLeft}
    </span>
  );
}
