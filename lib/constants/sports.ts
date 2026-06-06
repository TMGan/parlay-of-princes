/** Sports available via The Odds API (structured bet form + odds browser) */
export const API_SPORTS = [
  { key: 'americanfootball_nfl',         label: 'NFL' },
  { key: 'americanfootball_ncaaf',        label: 'College Football' },
  { key: 'basketball_nba',               label: 'NBA' },
  { key: 'basketball_ncaab',             label: 'College Basketball' },
  { key: 'baseball_mlb',                 label: 'MLB' },
  { key: 'icehockey_nhl',                label: 'NHL' },
  { key: 'soccer_usa_mls',               label: 'MLS Soccer' },
  { key: 'mma_mixed_martial_arts',       label: 'UFC / MMA' },
  { key: 'boxing_boxing',                label: 'Boxing' },
  { key: 'golf_pga_tour',                label: 'PGA Golf' },
  { key: 'motorsport_nascar_cup_series', label: 'NASCAR' },
] as const;

/** Sports available in the manual entry form (display labels only) */
export const MANUAL_SPORTS = [
  'NFL',
  'College Football',
  'NBA',
  'College Basketball',
  'MLB',
  'NHL',
  'MLS Soccer',
  'Tennis',
  'UFC / MMA',
  'Boxing',
  'PGA Golf',
  'NASCAR',
  'Horse Racing',
] as const;
