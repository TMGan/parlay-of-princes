import Image from 'next/image';

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
  sm: { cls: 'w-7 h-7 text-xs', px: 28 },
  md: { cls: 'w-9 h-9 text-sm', px: 36 },
  lg: { cls: 'w-12 h-12 text-lg', px: 48 },
  xl: { cls: 'w-16 h-16 text-2xl', px: 64 },
};

export function Avatar({
  username,
  size = 'md',
  imageUrl,
  className = '',
}: {
  username: string;
  size?: keyof typeof SIZE;
  imageUrl?: string | null;
  className?: string;
}) {
  const { cls, px } = SIZE[size];

  if (imageUrl) {
    return (
      <div className={`${cls} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <Image
          src={imageUrl}
          alt={username}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          unoptimized={imageUrl.startsWith('data:')}
        />
      </div>
    );
  }

  const initials = (username ?? '?').slice(0, 2).toUpperCase();
  return (
    <div
      className={`${cls} ${getColor(username)} ${className} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
