'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  usernames: string[];   // users who actually have pending bets this week (for autocomplete)
  selectedUser: string;
  selectedWeek: number;
}

export function ResolveUserFilter({ usernames, selectedUser, selectedWeek }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(selectedUser);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = query.trim()
    ? usernames.filter((u) => u.toLowerCase().includes(query.toLowerCase()) && u !== query)
    : usernames;

  const navigate = (user: string) => {
    const params = new URLSearchParams();
    params.set('week', String(selectedWeek));
    if (user) params.set('user', user);
    router.push(`/admin/resolve?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    navigate(query.trim());
  };

  const clear = () => {
    setQuery('');
    navigate('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <label className="text-sm text-gray-400 whitespace-nowrap">Filter by user:</label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search username…"
          className="pl-8 pr-7 py-1.5 bg-background border border-gray-700 rounded-full text-sm focus:border-primary focus:outline-none w-44"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X size={12} />
          </button>
        )}

        {/* Autocomplete dropdown */}
        {showSuggestions && filtered.length > 0 && (
          <ul className="absolute z-50 top-full mt-1 left-0 w-44 bg-background-light border border-gray-700 rounded-xl shadow-xl overflow-hidden text-sm">
            {filtered.slice(0, 8).map((u) => (
              <li key={u}>
                <button
                  type="button"
                  onMouseDown={() => { setQuery(u); setShowSuggestions(false); navigate(u); }}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 text-gray-300"
                >
                  @{u}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="submit"
        className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-sm hover:bg-primary/30 transition-colors"
      >
        Go
      </button>
    </form>
  );
}
