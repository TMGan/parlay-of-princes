export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  city?: string;
  mascot?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Matchup {
  id: string;
  league: string;
  startsAt: string;
  venue?: string;
  homeTeam: Team;
  awayTeam: Team;
}

export interface Odds {
  american: number;
  decimal: number;
  impliedProbability: number;
}

export type WagerOutcome = "pending" | "won" | "lost" | "void" | "push";

export interface BetLeg {
  id: string;
  matchupId: string;
  selection: string;
  odds: Odds;
  outcome: WagerOutcome;
}

export interface Parlay {
  id: string;
  userId: string;
  stake: number;
  potentialPayout: number;
  createdAt: string;
  settledAt?: string;
  status: WagerOutcome;
  legs: BetLeg[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  rank: number;
  roi: number;
  unitsWon: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
