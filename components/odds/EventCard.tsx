'use client';

import { useState } from 'react';
import { formatOdds } from '@/lib/utils/format';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { PlaceBetFromOdds } from './PlaceBetFromOdds';

interface EventCardProps {
  event: any;
  sport: string;
  userId: string;
}

interface PlayerProp {
  id: string;
  description: string;
  odds: number;
  marketName: string;
}

export function EventCard({ event, sport, userId }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlayerProps, setShowPlayerProps] = useState(false);
  const [playerProps, setPlayerProps] = useState<PlayerProp[]>([]);
  const [isLoadingProps, setIsLoadingProps] = useState(false);
  const [selectedProp, setSelectedProp] = useState<any>(null);

  const startTime = new Date(event.commence_time);
  const homeTeam = event.home_team;
  const awayTeam = event.away_team;

  // Get the first bookmaker's odds (usually DraftKings or FanDuel)
  const bookmaker = event.bookmakers?.[0];
  const markets = bookmaker?.markets || [];

  // Extract spreads and totals - ONLY POSITIVE ODDS
  const spreadMarket = markets.find((m: any) => m.key === 'spreads');
  const totalsMarket = markets.find((m: any) => m.key === 'totals');

  const homeSpread = spreadMarket?.outcomes?.find(
    (o: any) => o.name === homeTeam && o.price >= 100
  );
  const awaySpread = spreadMarket?.outcomes?.find(
    (o: any) => o.name === awayTeam && o.price >= 100
  );
  const overTotal = totalsMarket?.outcomes?.find(
    (o: any) => o.name === 'Over' && o.price >= 100
  );
  const underTotal = totalsMarket?.outcomes?.find(
    (o: any) => o.name === 'Under' && o.price >= 100
  );

  // Count how many positive odds we have
  const positiveOddsCount = [homeSpread, awaySpread, overTotal, underTotal].filter(Boolean).length;

  const fetchPlayerProps = async () => {
    if (playerProps.length > 0) {
      setShowPlayerProps(!showPlayerProps);
      return;
    }

    setIsLoadingProps(true);
    setShowPlayerProps(true);

    try {
      const response = await fetch(
        `/api/odds/player-props-enhanced?sport=${sport}&eventId=${event.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch player props');
      }

      const data = await response.json();
      setPlayerProps(data);
    } catch (error) {
      console.error('Error fetching player props:', error);
      setPlayerProps([]);
    } finally {
      setIsLoadingProps(false);
    }
  };

  const handleSelectProp = (description: string, odds: number) => {
    setSelectedProp({
      description,
      odds,
      gameStartTime: startTime,
    });
  };

  const sportLabel =
    sport === 'americanfootball_nfl'
      ? 'NFL'
      : sport === 'basketball_nba'
        ? 'NBA'
        : sport === 'baseball_mlb'
          ? 'MLB'
          : 'NHL';

  return (
    <div className="card">
      {/* Event Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-semibold text-secondary px-2 py-1 bg-secondary/10 rounded">
              {sportLabel}
            </span>
            <span className="text-sm text-gray-400">
              {startTime.toLocaleDateString()} • {startTime.toLocaleTimeString()}
            </span>
          </div>
          <h3 className="text-xl font-bold">
            {awayTeam} @ {homeTeam}
          </h3>
          {bookmaker && <p className="text-sm text-gray-400 mt-1">Odds from {bookmaker.title}</p>}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-background rounded transition-colors"
        >
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {/* Quick Odds Preview (only if we have positive odds) */}
      {!isExpanded && positiveOddsCount > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {homeSpread && (
            <div className="bg-background p-3 rounded">
              <p className="text-xs text-gray-400 mb-1">Home Spread</p>
              <p className="font-semibold">
                {homeTeam} {homeSpread.point > 0 ? '+' : ''}
                {homeSpread.point}
              </p>
              <p className="text-sm text-primary">{formatOdds(homeSpread.price)}</p>
            </div>
          )}
          {overTotal && (
            <div className="bg-background p-3 rounded">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="font-semibold">Over {overTotal.point}</p>
              <p className="text-sm text-primary">{formatOdds(overTotal.price)}</p>
            </div>
          )}
        </div>
      )}

      {/* No Positive Odds Message */}
      {!isExpanded && positiveOddsCount === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          No positive odds available for spreads/totals
        </div>
      )}

      {/* Expanded Odds Details */}
      {isExpanded && (
        <div className="space-y-6 mt-6">
          {/* Spreads */}
          {(homeSpread || awaySpread) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">SPREADS</h4>
              <div className="grid grid-cols-2 gap-4">
                {homeSpread && (
                  <button
                    onClick={() =>
                      handleSelectProp(
                        `${homeTeam} ${homeSpread.point > 0 ? '+' : ''}${homeSpread.point}`,
                        homeSpread.price
                      )
                    }
                    className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1">
                      {homeTeam} {homeSpread.point > 0 ? '+' : ''}
                      {homeSpread.point}
                    </p>
                    <p className="text-lg text-primary font-bold">{formatOdds(homeSpread.price)}</p>
                  </button>
                )}
                {awaySpread && (
                  <button
                    onClick={() =>
                      handleSelectProp(
                        `${awayTeam} ${awaySpread.point > 0 ? '+' : ''}${awaySpread.point}`,
                        awaySpread.price
                      )
                    }
                    className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1">
                      {awayTeam} {awaySpread.point > 0 ? '+' : ''}
                      {awaySpread.point}
                    </p>
                    <p className="text-lg text-primary font-bold">{formatOdds(awaySpread.price)}</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Totals */}
          {(overTotal || underTotal) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">TOTALS</h4>
              <div className="grid grid-cols-2 gap-4">
                {overTotal && (
                  <button
                    onClick={() => handleSelectProp(`Over ${overTotal.point}`, overTotal.price)}
                    className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1">Over {overTotal.point}</p>
                    <p className="text-lg text-primary font-bold">{formatOdds(overTotal.price)}</p>
                  </button>
                )}
                {underTotal && (
                  <button
                    onClick={() => handleSelectProp(`Under ${underTotal.point}`, underTotal.price)}
                    className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                  >
                    <p className="font-semibold mb-1">Under {underTotal.point}</p>
                    <p className="text-lg text-primary font-bold">{formatOdds(underTotal.price)}</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* No Positive Odds for Spreads/Totals */}
          {!homeSpread && !awaySpread && !overTotal && !underTotal && (
            <p className="text-gray-400 text-center py-4">
              No positive odds available for spreads/totals. Try player props!
            </p>
          )}

          {/* Player Props Button */}
          <div>
            <button
              onClick={fetchPlayerProps}
              disabled={isLoadingProps}
              className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
            >
              {isLoadingProps ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Loading Player Props...</span>
                </>
              ) : (
                <>
                  <span>{showPlayerProps ? 'Hide' : 'View'} Player Props</span>
                  {showPlayerProps ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </>
              )}
            </button>
          </div>

          {/* Player Props List */}
          {showPlayerProps && !isLoadingProps && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">PLAYER PROPS</h4>
              {playerProps.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No player props available for this game yet
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {playerProps.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => handleSelectProp(prop.description, prop.odds)}
                      className="bg-background p-4 rounded hover:border-primary border border-gray-800 transition-colors text-left"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-sm flex-1">{prop.description}</p>
                        <p className="text-primary font-bold ml-2">{formatOdds(prop.odds)}</p>
                      </div>
                      <p className="text-xs text-gray-400">{prop.marketName}</p>
                    </button>
                  ))}
                </div>
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
