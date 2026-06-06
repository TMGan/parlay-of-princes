'use client';

import { useEffect, useMemo, useState } from 'react';

export interface PlayerProp {
  id: string;
  marketKey: string;
  marketName: string;
  playerName: string;
  propType: string;
  line: number | null;
  odds: number;
  description: string;
  bookmaker: string;
}

// ─── Category definitions per sport ─────────────────────────────────────────
interface Category {
  label: string;
  markets: string[];
}

const SPORT_CATEGORIES: Record<string, Category[]> = {
  americanfootball_nfl: [
    { label: 'Passing',     markets: ['player_pass_tds', 'player_pass_yds', 'player_pass_attempts', 'player_pass_interceptions'] },
    { label: 'Rushing/Rec', markets: ['player_rush_yds', 'player_receptions', 'player_reception_yds'] },
    { label: 'Touchdowns',  markets: ['player_anytime_td'] },
    { label: 'Special',     markets: ['player_kicking_points', 'player_sacks'] },
  ],
  americanfootball_ncaaf: [
    { label: 'Passing',     markets: ['player_pass_tds', 'player_pass_yds'] },
    { label: 'Rushing/Rec', markets: ['player_rush_yds', 'player_receptions', 'player_reception_yds'] },
    { label: 'Touchdowns',  markets: ['player_anytime_td'] },
  ],
  basketball_nba: [
    { label: 'Points',      markets: ['player_points', 'player_threes', 'player_first_basket'] },
    { label: 'Boards/Ast',  markets: ['player_rebounds', 'player_assists', 'player_points_rebounds_assists'] },
    { label: 'Defense',     markets: ['player_blocks', 'player_steals'] },
    { label: 'Special',     markets: ['player_double_double'] },
  ],
  basketball_ncaab: [
    { label: 'Points',      markets: ['player_points', 'player_threes'] },
    { label: 'Boards/Ast',  markets: ['player_rebounds', 'player_assists'] },
  ],
  baseball_mlb: [
    { label: 'Batting',     markets: ['player_hits', 'player_home_runs', 'player_total_bases', 'player_rbis', 'player_runs_scored'] },
    { label: 'Pitching',    markets: ['player_strikeouts', 'player_hits_allowed', 'player_earned_runs', 'player_walks'] },
  ],
  icehockey_nhl: [
    { label: 'Goals',       markets: ['player_goals', 'player_first_goal_scorer'] },
    { label: 'Shots',       markets: ['player_shots_on_goal'] },
    { label: 'Points/Ast',  markets: ['player_points', 'player_assists', 'player_power_play_points'] },
    { label: 'Saves',       markets: ['player_saves'] },
  ],
  soccer_usa_mls: [
    { label: 'Goals',       markets: ['player_to_score', 'player_first_to_score'] },
    { label: 'Shots',       markets: ['player_shots_on_target'] },
  ],
  golf_pga_tour: [
    { label: 'Outright',    markets: ['golfer_win_tournament', 'golfer_top_5_finish', 'golfer_top_10_finish', 'golfer_top_20_finish', 'golfer_make_cut'] },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a numeric line to a short column header: 0.5 → "1+", 1.5 → "2+", etc. */
function lineLabel(line: number | null): string {
  if (line === null) return 'Pick';
  if (line % 1 === 0.5) return `${Math.ceil(line)}+`;
  return `O${line}`;
}

interface PropSection {
  marketKey: string;
  marketName: string;
  columns: string[];      // line keys  e.g. "0.5" | "1.5" | "null"
  colLabels: string[];    // display    e.g. "1+"  | "2+"  | "Pick"
  rows: { playerName: string; byLine: Record<string, PlayerProp> }[];
}

function buildSections(props: PlayerProp[], markets: string[]): PropSection[] {
  return markets.flatMap((marketKey) => {
    const mp = props.filter((p) => p.marketKey === marketKey);
    if (mp.length === 0) return [];

    const marketName = mp[0]!.marketName;

    // Unique sorted lines (null last)
    const lineSet = new Set(mp.map((p) => p.line));
    const lines = [...lineSet].sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });
    const columns  = lines.map((l) => (l === null ? 'null' : String(l)));
    const colLabels = lines.map(lineLabel);

    // Group by player name
    const playerMap = new Map<string, Record<string, PlayerProp>>();
    for (const prop of mp) {
      const col = prop.line === null ? 'null' : String(prop.line);
      if (!playerMap.has(prop.playerName)) playerMap.set(prop.playerName, {});
      playerMap.get(prop.playerName)![col] = prop;
    }

    const rows = [...playerMap.entries()].map(([playerName, byLine]) => ({ playerName, byLine }));

    return [{ marketKey, marketName, columns, colLabels, rows }];
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PropGridProps {
  props: PlayerProp[];
  sport: string;
  selectedProp: PlayerProp | null;
  onSelect: (prop: PlayerProp) => void;
}

export function PropGrid({ props, sport, selectedProp, onSelect }: PropGridProps) {
  const categories = SPORT_CATEGORIES[sport] ?? null;
  const [activeCategory, setActiveCategory] = useState<string>(categories?.[0]?.label ?? '');

  // Reset active category whenever the sport changes
  useEffect(() => {
    setActiveCategory(categories?.[0]?.label ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  const sections = useMemo(() => {
    if (!categories) return [];
    const cat = categories.find((c) => c.label === activeCategory);
    return cat ? buildSections(props, cat.markets) : [];
  }, [props, categories, activeCategory]);

  // ── Flat-list fallback (MMA, Boxing, NASCAR — h2h only) ──────────────────
  if (!categories) {
    return (
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {props.map((prop) => (
          <button
            key={prop.id}
            type="button"
            onClick={() => onSelect(prop)}
            className={`w-full p-3 rounded-xl border transition-colors text-left ${
              selectedProp?.id === prop.id
                ? 'bg-primary/10 border-primary'
                : 'bg-background border-gray-800 hover:border-primary'
            }`}
          >
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm font-medium">{prop.description}</span>
              <span className="text-primary font-bold shrink-0">+{prop.odds}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => setActiveCategory(cat.label)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeCategory === cat.label
                ? 'bg-primary text-black'
                : 'bg-background border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Selected prop summary (stays visible while scrolling) */}
      {selectedProp && (
        <div className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-sm">
          <span className="text-gray-400">Selected: </span>
          <span className="font-semibold text-white">{selectedProp.description}</span>
          <span className="text-primary font-bold ml-2">+{selectedProp.odds}</span>
        </div>
      )}

      {/* Market sections */}
      {sections.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          No props available for this category.
        </p>
      ) : (
        <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
          {sections.map((section) => (
            <div key={section.marketKey}>
              {/* Section label */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.marketName}
              </p>

              {/* Column headers */}
              <div
                className="grid items-center mb-1"
                style={{ gridTemplateColumns: `1fr repeat(${section.columns.length}, 3.75rem)` }}
              >
                <span />
                {section.colLabels.map((lbl) => (
                  <span
                    key={lbl}
                    className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {lbl}
                  </span>
                ))}
              </div>

              {/* Player rows */}
              <div className="space-y-1">
                {section.rows.map((row) => (
                  <div
                    key={row.playerName}
                    className="grid items-center"
                    style={{ gridTemplateColumns: `1fr repeat(${section.columns.length}, 3.75rem)` }}
                  >
                    <span className="text-sm truncate pr-2">{row.playerName}</span>

                    {section.columns.map((colKey) => {
                      const prop = row.byLine[colKey];
                      if (!prop) return <div key={colKey} className="h-9" />;
                      const isSelected = selectedProp?.id === prop.id;
                      return (
                        <button
                          key={colKey}
                          type="button"
                          onClick={() => onSelect(prop)}
                          className={`h-9 w-full rounded-lg text-sm font-bold transition-colors ${
                            isSelected
                              ? 'bg-primary text-black'
                              : 'bg-background-light border border-gray-700 text-primary hover:border-primary hover:bg-primary/5'
                          }`}
                        >
                          +{prop.odds}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
