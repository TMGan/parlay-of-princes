'use client';

import { useState } from 'react';
import { Users, Crown, Copy, Check } from 'lucide-react';
import type { getLeagueWithMembers } from '@/lib/db/league-queries';

type League = NonNullable<Awaited<ReturnType<typeof getLeagueWithMembers>>>;

interface LeagueOverviewProps {
  league: League;
  currentUserId: string;
}

export function LeagueOverview({ league, currentUserId }: LeagueOverviewProps) {
  const [copied, setCopied] = useState(false);

  const activeMemberCount = league.members.filter((m) => m.status === 'ACTIVE').length;
  const myMembership = league.members.find(
    (m) => m.userId === currentUserId && m.status === 'ACTIVE'
  );
  const isAdmin = myMembership?.role === 'ADMIN';

  const copyJoinCode = () => {
    navigator.clipboard.writeText(league.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {league.name}
        </h1>
        {league.description && (
          <p className="text-gray-400 mt-2">{league.description}</p>
        )}
        <div className="flex items-center space-x-4 mt-4 text-sm text-gray-400">
          <span>Created by {league.creator.username}</span>
          <span>•</span>
          <span>{league.isPublic ? 'Public' : 'Private'} League</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-primary/5 border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Users className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Members</p>
              <p className="text-2xl font-bold">
                {activeMemberCount}/{league.maxMembers}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-secondary/5 border-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Join Code</p>
              <p className="text-2xl font-bold font-mono tracking-wider">
                {league.joinCode}
              </p>
            </div>
            <button
              onClick={copyJoinCode}
              className="p-2 hover:bg-secondary/10 rounded transition-colors"
              title="Copy join code"
              aria-label="Copy join code"
            >
              {copied ? (
                <Check className="text-green-500" size={20} />
              ) : (
                <Copy className="text-gray-400" size={20} />
              )}
            </button>
          </div>
        </div>

        <div className="card bg-background-light">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${isAdmin ? 'bg-secondary/20' : 'bg-gray-700'}`}>
              {isAdmin ? (
                <Crown className="text-secondary" size={24} />
              ) : (
                <Users className="text-gray-400" size={24} />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400">Your Role</p>
              <p className="text-xl font-bold">{isAdmin ? 'Admin' : 'Member'}</p>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="card bg-background-light/50 p-4">
          <p className="text-sm text-gray-400">
            <strong className="text-white">Admin tip:</strong> Share the join code{' '}
            <strong className="text-secondary font-mono">{league.joinCode}</strong> with
            friends to invite them!
          </p>
        </div>
      )}
    </div>
  );
}
