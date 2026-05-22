import { Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  type: string;
  message: string;
  points: number | null;
  createdAt: Date;
}

const TYPE_ICON: Record<string, string> = {
  BET_WON: '🏆',
  BET_LOST: '💸',
  BET_VOIDED: '↩️',
  MEMBER_JOINED: '👋',
};

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export function LeagueActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Activity size={18} className="text-gray-400" />
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No activity yet. Activity will appear here as bets are resolved.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-background hover:bg-background/80 transition-colors">
              <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[a.type] ?? '📌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{a.message}</p>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
