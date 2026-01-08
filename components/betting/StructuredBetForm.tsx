'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface StructuredBetFormProps {
  userId: string;
  currentWeek: number;
  canPlaceRegularBet: boolean;
  canPlaceKingLock: boolean;
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sport: string;
}

interface PlayerProp {
  id: string;
  description: string;
  odds: number;
  playerName: string;
  propType: string;
  line: number | null;
  marketName: string;
}

const SPORTS = [
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'icehockey_nhl', label: 'NHL' },
];

export function StructuredBetForm({
  userId,
  currentWeek,
  canPlaceRegularBet,
  canPlaceKingLock,
}: StructuredBetFormProps) {
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState<'sport' | 'game' | 'prop'>('sport');

  // Selections
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedProp, setSelectedProp] = useState<PlayerProp | null>(null);
  const [isKingLock, setIsKingLock] = useState(false);

  // Data
  const [games, setGames] = useState<Game[]>([]);
  const [props, setProps] = useState<PlayerProp[]>([]);

  // Loading states
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isLoadingProps, setIsLoadingProps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errors
  const [error, setError] = useState('');

  // Fetch games when sport is selected
  useEffect(() => {
    if (selectedSport) {
      fetchGames();
    }
  }, [selectedSport]);

  // Fetch props when game is selected
  useEffect(() => {
    if (selectedGame) {
      fetchProps();
    }
  }, [selectedGame]);

  const fetchGames = async () => {
    setIsLoadingGames(true);
    setError('');

    try {
      const response = await fetch(`/api/odds/games?sport=${selectedSport}`);

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setGames(data);
      setStep('game');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingGames(false);
    }
  };

  const fetchProps = async () => {
    setIsLoadingProps(true);
    setError('');

    try {
      const response = await fetch(
        `/api/odds/player-props-enhanced?sport=${selectedSport}&eventId=${selectedGame?.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch player props');
      }

      const data = await response.json();

      if (data.length === 0) {
        setError('No player props available for this game yet');
      }

      setProps(data);
      setStep('prop');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingProps(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProp || !selectedGame) return;

    setIsSubmitting(true);
    setError('');

    try {
      const sportLabel = SPORTS.find((s) => s.key === selectedSport)?.label || selectedSport;

      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: sportLabel,
          description: selectedProp.description,
          oddsAmerican: selectedProp.odds,
          gameStartTime: new Date(selectedGame.commenceTime).toISOString(),
          isKingLock,
          userId,
          weekNumber: currentWeek,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place bet');
      }

      // Reset form
      setSelectedSport('');
      setSelectedGame(null);
      setSelectedProp(null);
      setIsKingLock(false);
      setStep('sport');
      setGames([]);
      setProps([]);

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (isKingLock ? canPlaceKingLock : canPlaceRegularBet) && selectedProp;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Select Sport */}
      {step === 'sport' && (
        <div>
          <label className="block text-sm font-medium mb-2">Step 1: Select Sport</label>
          <div className="grid grid-cols-2 gap-2">
            {SPORTS.map((sport) => (
              <button
                key={sport.key}
                onClick={() => setSelectedSport(sport.key)}
                className="p-3 bg-background rounded border border-gray-800 hover:border-primary transition-colors text-center font-medium"
              >
                {sport.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Game */}
      {step === 'game' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Step 2: Select Game
            <button
              onClick={() => {
                setStep('sport');
                setSelectedSport('');
                setGames([]);
              }}
              className="ml-3 px-3 py-1 text-xs bg-primary/20 text-gray-900 font-medium rounded hover:bg-primary/30 transition-colors"
>
  ← Change Sport
            </button>
          </label>

          {isLoadingGames ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : games.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No games available</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className="w-full p-3 bg-background rounded border border-gray-800 hover:border-primary transition-colors text-left"
                >
                  <div className="font-medium text-sm">
                    {game.awayTeam} @ {game.homeTeam}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(game.commenceTime).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Player Prop */}
      {step === 'prop' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Step 3: Select Player Prop
            <button
              onClick={() => {
                setStep('game');
                setSelectedGame(null);
                setProps([]);
              }}
              className="ml-3 px-3 py-1 text-xs bg-primary/20 text-gray-900 font-medium rounded hover:bg-primary/30 transition-colors"
>
  ← Change Game
            </button>
          </label>

          {isLoadingProps ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : props.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              {error || 'No props available for this game'}
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {props.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => setSelectedProp(prop)}
                  className={`w-full p-3 rounded border transition-colors text-left ${
                    selectedProp?.id === prop.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background border-gray-800 hover:border-primary'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{prop.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{prop.marketName}</div>
                    </div>
                    <div className="text-primary font-bold ml-2">+{prop.odds}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* King Lock Option */}
      {selectedProp && (
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="kingLockStructured"
            checked={isKingLock}
            onChange={(e) => setIsKingLock(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="kingLockStructured" className="text-sm">
            Make this my King Lock (2x points)
          </label>
        </div>
      )}

      {/* Submit Button */}
      {selectedProp && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isSubmitting ? 'Placing Bet...' : 'Place Bet'}
        </button>
      )}

      {!canSubmit && selectedProp && (
        <p className="text-sm text-yellow-500">
          {isKingLock
            ? 'You have already placed your King Lock for this week'
            : 'You have placed all 3 regular bets for this week'}
        </p>
      )}
    </div>
  );
}
