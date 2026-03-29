export interface League {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  joinCode: string;
  isPublic: boolean;
  minMembers: number;
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'REMOVED';
  joinedAt: Date;
}

export interface LeagueWithDetails extends League {
  creator: {
    id: string;
    username: string;
    email: string;
  };
  members: Array<{
    id: string;
    role: 'MEMBER' | 'ADMIN';
    status: 'PENDING' | 'ACTIVE' | 'REMOVED';
    joinedAt: Date;
    user: {
      id: string;
      username: string;
      email: string;
      totalPoints: number;
    };
  }>;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  email: string;
  totalPoints: number;
  betsWon: number;
  betsLost: number;
  winRate: number;
  role: 'MEMBER' | 'ADMIN';
}

export interface UserLeague {
  id: string;
  leagueId: string;
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'REMOVED';
  joinedAt: Date;
  league: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    creator: {
      id: string;
      username: string;
    };
    _count: {
      members: number;
    };
  };
}
