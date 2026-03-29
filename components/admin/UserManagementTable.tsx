'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPoints } from '@/lib/utils/format';
import { UserDetailsModal } from './UserDetailsModal';
import { PointAdjustmentModal } from './PointAdjustmentModal';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  totalPoints: number;
  betsWon: number;
  betsLost: number;
  winRate: number;
}

interface UserManagementTableProps {
  users: User[];
  adminEmail: string;
  isSuperAdmin: boolean;
}

export function UserManagementTable({ users, adminEmail, isSuperAdmin }: UserManagementTableProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAdjustPoints, setShowAdjustPoints] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmMessage =
      newRole === 'ADMIN'
        ? 'Promote this user to ADMIN? They will have limited admin powers.'
        : 'Demote this admin to USER? They will lose admin access.';

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change role');
      }

      router.refresh();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('An error occurred');
      alert(`Error: ${err.message}`);
    }
  };

  const canManageUser = (user: User) => {
    if (isSuperAdmin) {
      return user.email !== adminEmail;
    }

    return user.role !== 'ADMIN';
  };

  const canPromote = (user: User) => {
    return isSuperAdmin && user.role === 'USER';
  };

  const canDemote = (user: User) => {
    return isSuperAdmin && user.role === 'ADMIN' && user.email !== 'admin@parlayofprinces.com';
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-light">
              <tr className="text-left text-gray-400 text-sm">
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4">W/L</th>
                <th className="px-6 py-4">Win Rate</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((user) => {
                const isSuperAdminUser = user.email === 'admin@parlayofprinces.com';

                return (
                  <tr key={user.id} className="hover:bg-background-light transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.username}</span>
                        {isSuperAdminUser && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            SUPER
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          user.role === 'ADMIN'
                            ? 'bg-secondary/20 text-secondary'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-primary font-bold">{formatPoints(user.totalPoints)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-green-500">{user.betsWon}</span> /{' '}
                      <span className="text-red-500">{user.betsLost}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.winRate}%</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetails(true);
                          }}
                          className="text-xs px-3 py-1 bg-background border border-gray-700 rounded hover:border-primary transition-colors"
                        >
                          Details
                        </button>

                        {canManageUser(user) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowAdjustPoints(true);
                              }}
                              className="text-xs px-3 py-1 bg-background border border-gray-700 rounded hover:border-primary transition-colors"
                            >
                              Adjust Points
                            </button>

                            {(canPromote(user) || canDemote(user)) && (
                              <button
                                onClick={() => handleRoleChange(user.id, user.role)}
                                className="text-xs px-3 py-1 bg-secondary/20 border border-secondary/50 text-secondary rounded hover:bg-secondary/30 transition-colors"
                              >
                                {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No users found matching &quot;{searchTerm}&quot;
          </div>
        )}
      </div>

      {selectedUser && showDetails && (
        <UserDetailsModal user={selectedUser} onClose={() => setShowDetails(false)} />
      )}

      {selectedUser && showAdjustPoints && (
        <PointAdjustmentModal
          user={selectedUser}
          onClose={() => {
            setShowAdjustPoints(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
