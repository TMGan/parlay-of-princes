'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserCheck, UserX, Clock } from 'lucide-react';

interface PendingRequest {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface LeagueAdminPanelProps {
  leagueId: string;
}

export function LeagueAdminPanel({ leagueId }: LeagueAdminPanelProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/pending-requests`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data);
      setError('');
    } catch (err) {
      setError('Failed to load pending requests');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (userId: string) => {
    setActionInProgress(userId);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/members/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to approve');
      await fetchRequests();
    } catch (err) {
      setError('Failed to approve request');
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeny = async (userId: string) => {
    setActionInProgress(userId);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/members/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to deny');
      await fetchRequests();
    } catch (err) {
      setError('Failed to deny request');
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-secondary" />
          <h2 className="text-lg font-bold">Pending Join Requests</h2>
          {requests.length > 0 && (
            <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-medium">
              {requests.length}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-accent" role="alert">{error}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No pending requests</p>
      ) : (
        <ul className="divide-y divide-gray-800">
          {requests.map((req) => {
            const isActing = actionInProgress === req.user.id;
            return (
              <li key={req.id} className="flex items-center justify-between py-4 gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{req.user.username}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Requested {formatDistanceToNow(new Date(req.joinedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(req.user.id)}
                    disabled={isActing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCheck size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeny(req.user.id)}
                    disabled={isActing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserX size={14} />
                    Deny
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
