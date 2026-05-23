'use client';

import { useState } from 'react';
import { formatOdds } from '@/lib/utils/format';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { PlaceBetFromOdds } from './PlaceBetFromOdds';

interface Outcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
}

interface Market {
  key: string;
  outcomes?: Outcome[];
}

interface Bookmaker {
  title: string;
  markets?: Market[];
}

export interface SportsEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker[];
}

interface EventCardProps {
  event: SportsEvent;
  sport: string;
  userId: string;
}

interface PlayerProp {
  id: string;
  description: string;
  odds: number;
  marketKey: string;
  marketName: string;
  playerName: string;
  propType: string;
  line: number | null;
}

// Human-readable market category names
const MARKET_LABELS: Record<string, string> = {
  player_goals: 'Goals',
  player_shots_on_goal: 'Shots',
  player_points: 'Points',
  player_assists: 'Assists',
  player_pass_tds: 'Pass TDs',
  player_pass_yds: 'Pass Yards',
  player_rush_yds: 'Rush Yards',
  player_receptions: 'Receptions',
  player_reception_yds: 'Rec Yards',
  player_home_runs: 'Home Runs',
  player_hits: 'Hits',
  player_rbis: 'RBIs',
  player_runs_scored: 'Runs',
  player_strikeouts: 'Strikeouts',
  player_total_bases: 'Total Bases',
  player_rebounds: 'Rebounds',
  player_threes: '3-Pointers',
  player_blocks: 'Blocks',
  player_steals: 'Steals',
};

function marketLabel(key: string) {
  return MARKET_LABELS[key] ?? key.replace(/player_/i, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Column label for a propType + line combo, e.g. "Over 0.5" → "Anytime", "Over 1.5" → "1.5+" */
function colLabel(propType: string, line: number | null): string {
  if (line === null) return propType;
  if (propType === 'Over') {
    if (line === 0.5) return 'Anytime';
    return `${line}+`;
  }
  if (propType === 'Under') return `U${line}`;
  return `${propType} ${line}`;
}

type ColKey = string; // e.g. "Over_0.5"

interface PropGroup {
  marketKey: string;
  cols: ColKey[];
  colLabels: Record<ColKey, string>;
  // playerName → colKey → { odds, prop }
  rows: Record<string, Record<ColKey, PlayerProp>>;
  playerOrder: string[];
}

function groupProps(props: PlayerProp[]): PropGroup[] {
  const byMarket: Record<string, PlayerProp[]> = {};
  for (const p of props) {
    if (!byMarket[p.marketKey]) byMarket[p.marketKey] = [];
    byMarket[p.marketKey]!.push(p);
  }

  return Object.entries(byMarket).map(([marketKey, marketProps]) => {
    const colSet = new Set<ColKey>();
    const rows: Record<string, Record<ColKey, PlayerProp>> = {};

    for (const p of marketProps) {
      const colKey = `${p.propType}_${p.line ?? 'x'}`;
      colSet.add(colKey);
      if (!rows[p.playerName]) rows[p.playerName] = {};
      rows[p.playerName]![colKey] = p;
    }

    // Sort columns: Over lines first (ascending), then Under
    const cols = Array.from(colSet).sort((a, b) => {
      const [atA, lineA] = a.split('_');
      const [atB, lineB] = b.split('_');
      if (atA === 'Over' && atB !== 'Over') return -1;
      if (atA !== 'Over' && atB === 'Over') return 1;
      return Number(lineA ?? 0) - Number(lineB ?? 0);
    });

    const colLabels: Record<ColKey, string> = {};
    for (const c of cols) {
      const [pt, lineStr] = c.split('_');
      const line = lineStr === 'x' || lineStr === undefined ? null : Number(lineStr);
      colLabels[c] = colLabel(pt ?? '', line);
    }

    // Sort players: by best Anytime/first-col odds desc, then alphabetically
    const firstCol = cols[0];
    const playerOrder = Object.keys(rows).sort((a, b) => {
      if (firstCol) {
        const oddsA = rows[a]?.[firstCol]?.odds ?? 0;
        const oddsB = rows[b]?.[firstCol]?.odds ?? 0;
        if (oddsA !== oddsB) return oddsA - oddsB;
      }
      return a.localeCompare(b);
    });

    return { marketKey, cols, colLabels, rows, playerOrder };
  });
}

export function EventCard({ event, sport, userId }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlayerProps, setShowPlayerProps] = useState(false);
  const [playerProps, setPlayerProps] = useState<PlayerProp[]>([]);
  const [isLoadingProps, setIsLoadingProps] = useState(false);
  const [activeMarket, setActiveMarket] = useState<string | null>(null);
  const [selectedProp, setSelectedProp] = useState<{ description: string; odds: number; gameStartTime: Date } | null>(null);

  const startTime = new Date(event.commence_time);
  const homeTeam = event.home_team;
  const awayTeam = event.away_team;

  const bookmaker = event.bookmakers?.[0];
  const markets = bookmaker?.markets || [];

  const spreadMarket = markets.find((m: Market) => m.key === 'spreads');
  const totalsMarket = markets.find((m: Market) => m.key === 'totals');

  const homeSpread = spreadMarket?.outcomes?.find((o: Outcome) => o.name === homeTeam && o.price >= 100);
  const awaySpread = spreadMarket?.outcomes?.find((o: Outcome) => o.name === awayTeam && o.price >= 100);
  const overTotal = totalsMarket?.outcomes?.find((o: Outcome) => o.name === 'Over' && o.price >= 100);
  const underTotal = totalsMarket?.outcomes?.find((o: Outcome) => o.name === 'Under' && o.price >= 100);
  const positiveOddsCount = [homeSpread, awaySpread, overTotal, underTotal].filter(Boolean).length;

  const fetchPlayerProps = async () => {
    if (playerProps.length > 0) {
      setShowPlayerProps(!showPlayerProps);
      return;
    }
    setIsLoadingProps(true);
    setShowPlayerProps(true);
    try {
      const response = await fetch(`/api/odds/player-props-enhanced?sport=${sport}&eventId=${event.id}`);
      if (!response.ok) throw new Error('Failed to fetch player props');
      const data = (await response.json()) as PlayerProp[];
      setPlayerProps(data);
      if (data.length > 0) setActiveMarket(data[0]!.marketKey);
    } catch (error) {
      console.error('Error fetching player props:', error);
      setPlayerProps([]);
    } finally {
      setIsLoadingProps(false);
    }
  };

  const handleSelectProp = (description: string, odds: number) => {
    setSelectedProp({ description, odds, gameStartTime: startTime });
  };

  const sportLabel =
    sport === 'americanfootball_nfl' ? 'NFL'
    : sport === 'basketball_nba' ? 'NBA'
    : sport === 'baseball_mlb' ? 'MLB'
    : 'NHL';

  const propGroups = groupProps(playerProps);
  const activeGroup = propGroups.find((g) => g.marketKey === activeMarket) ?? propGroups[0] ?? null;

  return (
    <div className="card">
      {/* Event Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded-full">
              {sportLabel}
            </span>
            <span className="text-sm text-gray-400">
              {startTime.toLocaleDateString()} • {startTime.toLocaleTimeString()}
            </span>
          </div>
          <h3 className="text-xl font-bold">{awayTeam} @ {homeTeam}</h3>
          {bookmaker && <p className="text-sm text-gray-400 mt-1">Odds from {bookmaker.title}</p>}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-background rounded-xl transition-colors"
        >
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {/* Quick preview */}
      {!isExpanded && positiveOddsCount > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {homeSpread && (
            <div className="bg-background p-3 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Home Spread</p>
              <p className="font-semibold">{homeTeam} {(homeSpread.point ?? 0) > 0 ? '+' : ''}{homeSpread.point ?? 0}</p>
              <p className="text-sm text-primary">{formatOdds(homeSpread.price)}</p>
            </div>
          )}
          {overTotal && (
            <div className="bg-background p-3 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="font-semibold">Over {overTotal.point}</p>
              <p className="text-sm text-primary">{formatOdds(overTotal.price)}</p>
            </div>
          )}
        </div>
      )}

      {!isExpanded && positiveOddsCount === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          No positive odds available for spreads/totals
        </div>
      )}

      {/* Expanded */}
      {isExpanded && (
        <div className="space-y-6 mt-6">
          {/* Spreads */}
          {(homeSpread || awaySpread) && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Spreads</h4>
              <div className="grid grid-cols-2 gap-3">
                {homeSpread && (
                  <button
                    onClick={() => handleSelectProp(`${homeTeam} ${(homeSpread.point ?? 0) > 0 ? '+' : ''}${homeSpread.point ?? 0}`, homeSpread.price)}
                    className="bg-background p-4 rounded-xl hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1 text-sm">{homeTeam} {(homeSpread.point ?? 0) > 0 ? '+' : ''}{homeSpread.point ?? 0}</p>
                    <p className="text-lg text-primary font-bold">{formatOdds(homeSpread.price)}</p>
                  </button>
                )}
                {awaySpread && (
                  <button
                    onClick={() => handleSelectProp(`${awayTeam} ${(awaySpread.point ?? 0) > 0 ? '+' : ''}${awaySpread.point ?? 0}`, awaySpread.price)}
                    className="bg-background p-4 rounded-xl hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1 text-sm">{awayTeam} {(awaySpread.point ?? 0) > 0 ? '+' : ''}{awaySpread.point ?? 0}</p>
                    <p className="text-lg text-primary font-bold">{formatOdds(awaySpread.price)}</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Totals */}
          {(overTotal || underTotal) && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Totals</h4>
              <div className="grid grid-cols-2 gap-3">
                {overTotal && (
                  <button
                    onClick={() => handleSelectProp(`Over ${overTotal.point}`, overTotal.price)}
                    className="bg-background p-4 rounded-xl hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1 text-sm">Over {overTotal.point ?? 0}</p>
                    <p className="text-lg text-primary font-bold">{formatOdds(overTotal.price)}</p>
                  </button>
                )}
                {underTotal && (
                  <button
                    onClick={() => handleSelectProp(`Under ${underTotal.point}`, underTotal.price)}
                    className="bg-background p-4 rounded-xl hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1 text-sm">Under {underTotal.point ?? 0}</p>
                    <p className="text-lg text-primary font-bold">{formatOdds(underTotal.price)}</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Player Props Button */}
          <div>
            <button
              onClick={fetchPlayerProps}
              disabled={isLoadingProps}
              className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
            >
              {isLoadingProps ? (
                <><Loader2 className="animate-spin" size={20} /><span>Loading Player Props…</span></>
              ) : (
                <><span>{showPlayerProps ? 'Hide' : 'View'} Player Props</span>{showPlayerProps ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</>
              )}
            </button>
          </div>

          {/* ── Player Props — grouped by category ── */}
          {showPlayerProps && !isLoadingProps && (
            <div className="space-y-4">
              {playerProps.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No player props available for this game yet</p>
              ) : (
                <>
                  {/* Category tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {propGroups.map((g) => (
                      <button
                        key={g.marketKey}
                        onClick={() => setActiveMarket(g.marketKey)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          activeMarket === g.marketKey
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        {marketLabel(g.marketKey)}
                      </button>
                    ))}
                  </div>

                  {/* Active category table */}
                  {activeGroup && (
                    <div className="overflow-x-auto rounded-xl border border-gray-800">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800 bg-background-light">
                            <th className="text-left px-4 py-2.5 font-semibold text-gray-400 min-w-[140px]">
                              Player
                            </th>
                            {activeGroup.cols.map((c) => (
                              <th key={c} className="px-4 py-2.5 font-semibold text-gray-400 text-right whitespace-nowrap">
                                {activeGroup.colLabels[c]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeGroup.playerOrder.map((player, idx) => (
                            <tr
                              key={player}
                              className={`border-b border-gray-800 last:border-0 ${idx % 2 === 0 ? '' : 'bg-background-light/30'}`}
                            >
                              <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">
                                {player}
                              </td>
                              {activeGroup.cols.map((c) => {
                                const prop = activeGroup.rows[player]?.[c];
                                return (
                                  <td key={c} className="px-4 py-3 text-right">
                                    {prop ? (
                                      <button
                                        onClick={() => handleSelectProp(prop.description, prop.odds)}
                                        className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/25 transition-colors text-sm"
                                      >
                                        {formatOdds(prop.odds)}
                                      </button>
                                    ) : (
                                      <span className="text-gray-700">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Place Bet Modal */}
      {selectedProp && (
        <PlaceBetFromOdds
          userId={userId}
          sport={sportLabel}
          description={selectedProp.description}
          odds={selectedProp.odds}
          gameStartTime={selectedProp.gameStartTime}
          onClose={() => setSelectedProp(null)}
        />
      )}
    </div>
  );
}
