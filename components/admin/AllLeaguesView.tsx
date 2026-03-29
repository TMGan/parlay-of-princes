'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface League {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  isPublic: boolean;
  maxMembers: number;
  createdAt: string;
  creator: {
    username: string;
    email: string;
  };
  _count: {
    members: number;
    messages: number;
  };
}

export function AllLeaguesView() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/admin/leagues')
      .then((r) => r.json())
      .then(setLeagues)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = leagues.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.joinCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMembers = leagues.reduce((s, l) => s + l._count.members, 0);
  const totalMessages = leagues.reduce((s, l) => s + l._count.messages, 0);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Loading leagues...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-primary/5 border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Users className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Leagues</p>
              <p className="text-2xl font-bold">{leagues.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-secondary/5 border-secondary/20">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-secondary/20 rounded-lg">
              <Users className="text-secondary" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Members</p>
              <p className="text-2xl font-bold">{totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="card bg-background-light">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-700 rounded-lg">
              <MessageSquare className="text-gray-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Messages</p>
              <p className="text-2xl font-bold">{totalMessages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search by league name, creator, or join code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchTerm ? `No leagues matching "${searchTerm}"` : 'No leagues created yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-light">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-4">League</th>
                  <th className="px-6 py-4">Creator</th>
                  <th className="px-6 py-4">Join Code</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-center">Members</th>
                  <th className="px-6 py-4 text-center">Messages</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((league) => (
                  <tr key={league.id} className="hover:bg-background-light transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{league.name}</p>
                      {league.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {league.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{league.creator.username}</p>
                      <p className="text-xs text-gray-400">{league.creator.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-background px-2 py-1 rounded font-mono">
                        {league.joinCode}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          league.isPublic
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {league.isPublic ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm">
                        {league._count.members}/{league.maxMembers}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm">{league._count.messages}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDistanceToNow(new Date(league.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/leagues/${league.id}`}
                        className="text-xs px-3 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
