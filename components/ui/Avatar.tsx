const COLORS = [
  'bg-violet-600',
  'bg-blue-600',
  'bg-cyan-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-pink-600',
  'bg-indigo-600',
];

function getColor(username: string) {
  if (!username) return COLORS[0]!;
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length] ?? COLORS[0]!;
}

const SIZE = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

export function Avatar({
  username,
  size = 'md',
  className = '',
}: {
  username: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const initials = (username ?? '?').slice(0, 2).toUpperCase();
  return (
    <div
      className={`${SIZE[size]} ${getColor(username)} ${className} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
