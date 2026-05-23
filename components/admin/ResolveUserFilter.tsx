'use client';

import { useRouter } from 'next/navigation';

interface Props {
  usernames: string[];
  selectedUser: string;
  selectedWeek: number;
}

export function ResolveUserFilter({ usernames, selectedUser, selectedWeek }: Props) {
  const router = useRouter();

  const handleChange = (value: string) => {
    const params = new URLSearchParams();
    params.set('week', String(selectedWeek));
    if (value) params.set('user', value);
    router.push(`/admin/resolve?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-400 whitespace-nowrap">Filter by user:</label>
      <select
        value={selectedUser}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-1.5 bg-background border border-gray-700 rounded text-sm focus:border-primary focus:outline-none min-w-[140px]"
      >
        <option value="">All users</option>
        {usernames.map((u) => (
          <option key={u} value={u}>@{u}</option>
        ))}
      </select>
    </div>
  );
}
