/** Sports available via The Odds API (structured bet form + odds browser) */
export const API_SPORTS = [
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'icehockey_nhl', label: 'NHL' },
  { key: 'mma_mixed_martial_arts', label: 'UFC / MMA' },
  { key: 'boxing_boxing', label: 'Boxing' },
  { key: 'golf_pga_tour', label: 'PGA Golf' },
] as const;

/** Sports available in the manual entry form (display labels only) */
export const MANUAL_SPORTS = [
  'NFL', 'NBA', 'MLB', 'NHL',
  'UFC / MMA', 'Boxing', 'PGA Golf',
] as const;
