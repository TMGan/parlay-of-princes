'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekSelectorProps {
  currentWeek: number;
  selectedWeek: number;
  weekOptions: number[];
}

export function WeekSelector({ currentWeek, selectedWeek, weekOptions }: WeekSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (week: number) => router.push(`${pathname}?week=${week}`);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(selectedWeek - 1)}
        disabled={selectedWeek <= 1}
        className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <select
        value={selectedWeek}
        onChange={(e) => go(Number(e.target.value))}
        className="px-3 py-1.5 bg-background border border-gray-800 rounded text-sm focus:border-primary focus:outline-none"
      >
        {weekOptions.map((w) => (
          <option key={w} value={w}>
            Week {w}{w === currentWeek ? ' (current)' : ''}
          </option>
        ))}
      </select>

      <button
        onClick={() => go(selectedWeek + 1)}
        disabled={selectedWeek >= currentWeek}
        className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
