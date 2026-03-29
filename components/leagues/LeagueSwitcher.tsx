'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Users } from 'lucide-react';
import type { getUserLeagues } from '@/lib/db/league-queries';

type UserLeagues = Awaited<ReturnType<typeof getUserLeagues>>;

interface LeagueSwitcherProps {
  leagues: UserLeagues;
  currentLeagueId?: string;
}

export function LeagueSwitcher({ leagues, currentLeagueId }: LeagueSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(
    currentLeagueId ?? leagues[0]?.league.id ?? null
  );

  if (leagues.length === 0) {
    return (
      <Link
        href="/leagues/create"
        className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
      >
        <Plus size={14} />
        <span>Create League</span>
      </Link>
    );
  }

  const currentLeague = leagues.find((l) => l.league.id === selectedLeagueId);

  const handleLeagueSelect = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
    setIsOpen(false);
    router.push(`/leagues/${leagueId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-background border border-gray-800 rounded hover:border-primary transition-colors"
        aria-label="Select league"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Users size={16} className="text-primary" />
        <span className="text-sm font-medium max-w-[120px] truncate">
          {currentLeague?.league.name ?? 'Select League'}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 mt-2 w-64 bg-background-light border border-gray-800 rounded-lg shadow-xl z-50"
            role="listbox"
            aria-label="Your leagues"
          >
            <div className="py-2">
              <div className="px-4 py-1.5 text-xs text-gray-400 uppercase tracking-wide">
                My Leagues
              </div>

              {leagues.map((membership) => (
                <button
                  key={membership.league.id}
                  onClick={() => handleLeagueSelect(membership.league.id)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-background transition-colors ${
                    membership.league.id === selectedLeagueId
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-200'
                  }`}
                  role="option"
                  aria-selected={membership.league.id === selectedLeagueId}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{membership.league.name}</span>
                    {membership.role === 'ADMIN' && (
                      <span className="ml-2 shrink-0 text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {membership.league._count.members} members
                  </div>
                </button>
              ))}

              <div className="border-t border-gray-800 mt-1 pt-1">
                <Link
                  href="/leagues/create"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-primary hover:bg-background transition-colors"
                >
                  <Plus size={14} />
                  <span>Create New League</span>
                </Link>
                <Link
                  href="/leagues/join"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-2 text-sm text-gray-400 hover:bg-background hover:text-white transition-colors"
                >
                  Join League
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
