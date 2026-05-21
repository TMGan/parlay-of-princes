'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  X,
  Home,
  Trophy,
  TrendingUp,
  User,
  Settings,
  LogOut,
  Users,
  Plus,
  Crown,
  BarChart2,
} from 'lucide-react';
import type { getUserLeagues } from '@/lib/db/league-queries';

type UserLeagues = Awaited<ReturnType<typeof getUserLeagues>>;

interface MobileNavProps {
  username: string;
  leagues: UserLeagues;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { href: '/bets', label: 'My Bets', icon: <Trophy size={20} /> },
  { href: '/leaderboard', label: 'Leaderboard', icon: <BarChart2 size={20} /> },
  { href: '/odds', label: 'Live Odds', icon: <TrendingUp size={20} /> },
  { href: '/profile', label: 'Profile', icon: <User size={20} /> },
  { href: '/admin', label: 'Admin', icon: <Settings size={20} />, adminOnly: true },
];

export function MobileNav({ username, leagues, isAdmin, signOutAction }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const visibleLinks = NAV_LINKS.filter((l) => !l.adminOnly || isAdmin);

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-background-light border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800 shrink-0">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Parlay of Princes
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* User greeting */}
          <div className="px-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{username}</p>
                {isAdmin && (
                  <p className="text-xs text-secondary flex items-center gap-1">
                    <Crown size={10} />
                    Admin
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="px-2 space-y-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-300 hover:bg-background hover:text-white'
                } ${link.adminOnly ? 'text-secondary hover:text-secondary' : ''}`}
              >
                <span className={isActive(link.href) ? 'text-primary' : link.adminOnly ? 'text-secondary' : 'text-gray-400'}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Leagues section */}
          <div className="mt-6 px-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">My Leagues</p>
            <div className="space-y-1">
              {leagues.length === 0 ? (
                <Link
                  href="/leagues/create"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-background rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Create a League
                </Link>
              ) : (
                <>
                  {leagues.map((membership) => (
                    <Link
                      key={membership.league.id}
                      href={`/leagues/${membership.league.id}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        pathname === `/leagues/${membership.league.id}`
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-300 hover:bg-background hover:text-white'
                      }`}
                    >
                      <Users size={16} className="text-gray-400 shrink-0" />
                      <span className="truncate">{membership.league.name}</span>
                      {membership.role === 'ADMIN' && (
                        <span className="ml-auto shrink-0 text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </Link>
                  ))}
                  <Link
                    href="/leagues/create"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-background rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Create New League
                  </Link>
                  <Link
                    href="/leagues/join"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-background rounded-lg transition-colors"
                  >
                    <Users size={16} />
                    Join League
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Logout — pinned to bottom */}
        <div className="shrink-0 p-4 border-t border-gray-800">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-background hover:text-white transition-colors"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
