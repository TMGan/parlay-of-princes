'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight, RotateCcw } from 'lucide-react';

import { API_SPORTS as SPORTS } from '@/lib/constants/sports';

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
}

interface Prop {
  id: string;
  description: string;
  odds: number;
  marketName: string;
}

type PickerStep = 'sport' | 'game' | 'prop';

export function BonusBetForm() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Picker state
  const [pickerStep, setPickerStep] = useState<PickerStep>('sport');
  const [selectedSportKey, setSelectedSportKey] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [props, setProps] = useState<Prop[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingProps, setLoadingProps] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState('');
  const [oddsAmerican, setOddsAmerican] = useState('');
  const [gameStartTime, setGameStartTime] = useState('');
  const [availableDate, setAvailableDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const isAutoFilled = !!selectedGame;

  useEffect(() => {
    if (!selectedSportKey) return;
    setLoadingGames(true);
    fetch(`/api/odds/games?sport=${selectedSportKey}`)
      .then((r) => r.json())
      .then((data: Game[]) => { setGames(data); setPickerStep('game'); })
      .catch(() => setError('Failed to fetch games'))
      .finally(() => setLoadingGames(false));
  }, [selectedSportKey]);

  useEffect(() => {
    if (!selectedGame) return;
    setLoadingProps(true);
    fetch(`/api/odds/player-props-enhanced?sport=${selectedSportKey}&eventId=${selectedGame.id}`)
      .then((r) => r.json())
      .then((data: Prop[]) => { setProps(data); setPickerStep('prop'); })
      .catch(() => setError('Failed to fetch props'))
      .finally(() => setLoadingProps(false));
  }, [selectedGame, selectedSportKey]);

  const handlePropSelect = (prop: Prop) => {
    const sportLabel = SPORTS.find((s) => s.key === selectedSportKey)?.label ?? selectedSportKey;
    // Auto-fill form fields
    setDescription(prop.description);
    setOddsAmerican(String(prop.odds));
    setSport(sportLabel);
    setGameStartTime(
      new Date(selectedGame!.commenceTime).toISOString().slice(0, 16)
    );
  };

  const resetPicker = () => {
    setPickerStep('sport');
    setSelectedSportKey('');
    setSelectedGame(null);
    setGames([]);
    setProps([]);
    setDescription('');
    setOddsAmerican('');
    setSport('');
    setGameStartTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/bonus-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          sport,
          oddsAmerican: Number(oddsAmerican),
          gameStartTime: new Date(gameStartTime).toISOString(),
          availableDate: new Date(availableDate).toISOString(),
          expiryDate: new Date(expiryDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create bonus pick');

      // Reset everything
      setName(''); setDescription(''); setSport(''); setOddsAmerican('');
      setGameStartTime(''); setAvailableDate(''); setExpiryDate('');
      resetPicker();
      setIsExpanded(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <button onClick={() => setIsExpanded(true)} className="btn-primary">
        + Create Bonus Pick
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">New Bonus Pick</h3>
        <button type="button" onClick={() => { setIsExpanded(false); resetPicker(); }}
          className="text-sm text-gray-400 hover:text-white">
          ✕ Cancel
        </button>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Step picker — auto-fills description, odds, game time */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-300">
            {isAutoFilled ? '✓ Pick selected from live odds' : 'Step 1 — Pick from live odds'}
          </p>
          {isAutoFilled && (
            <button type="button" onClick={resetPicker}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
              <RotateCcw size={12} /> Change pick
            </button>
          )}
        </div>

        {!isAutoFilled && (
          <div className="bg-background rounded-lg border border-gray-800 p-4 space-y-3">
            {/* Sport */}
            {pickerStep === 'sport' && (
              <div className="grid grid-cols-2 gap-2">
                {SPORTS.map((s) => (
                  <button key={s.key} type="button"
                    onClick={() => setSelectedSportKey(s.key)}
                    disabled={loadingGames}
                    className="p-3 rounded border border-gray-700 hover:border-primary transition-colors text-sm font-medium disabled:opacity-50">
                    {loadingGames && selectedSportKey === s.key
                      ? <Loader2 className="animate-spin mx-auto" size={16} />
                      : s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Game */}
            {pickerStep === 'game' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Select game</span>
                  <button type="button" onClick={() => { setPickerStep('sport'); setSelectedSportKey(''); setGames([]); }}
                    className="text-xs text-gray-400 hover:text-white">← Back</button>
                </div>
                {loadingGames ? (
                  <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={24} /></div>
                ) : games.length === 0 ? (
                  <p className="text-sm text-gray-400">No games available</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {games.map((g) => (
                      <button key={g.id} type="button" onClick={() => setSelectedGame(g)}
                        className="w-full p-2 rounded border border-gray-700 hover:border-primary transition-colors text-left text-sm">
                        <span className="font-medium">{g.awayTeam} @ {g.homeTeam}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">
                          {new Date(g.commenceTime).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prop */}
            {pickerStep === 'prop' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Select prop</span>
                  <button type="button" onClick={() => { setPickerStep('game'); setSelectedGame(null); setProps([]); }}
                    className="text-xs text-gray-400 hover:text-white">← Back</button>
                </div>
                {loadingProps ? (
                  <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={24} /></div>
                ) : props.length === 0 ? (
                  <p className="text-sm text-gray-400">No props available — enter manually below</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {props.map((p) => (
                      <button key={p.id} type="button" onClick={() => handlePropSelect(p)}
                        className="w-full p-2 rounded border border-gray-700 hover:border-primary transition-colors text-left text-sm flex justify-between items-start">
                        <span className="flex-1 text-xs">{p.description}</span>
                        <span className="text-primary font-bold ml-2 shrink-0">+{p.odds}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isAutoFilled && (
          <div className="bg-background rounded-lg border border-gray-800 p-3 flex items-center justify-between text-sm">
            <span className="text-gray-300 truncate flex-1">{description}</span>
            <span className="text-primary font-bold ml-3 shrink-0">+{oddsAmerican}</span>
            <ChevronRight size={14} className="text-gray-600 ml-2 shrink-0" />
          </div>
        )}
      </div>

      {/* Rest of the form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Bonus Pick Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. King's Gambit" maxLength={100} required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Odds {isAutoFilled ? <span className="text-xs text-green-500">(auto-filled)</span> : '*'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+</span>
            <input type="number" value={oddsAmerican} onChange={(e) => setOddsAmerican(e.target.value)}
              placeholder="150" min={100} max={10000} required
              className="w-full pl-8 pr-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Pick Description {isAutoFilled ? <span className="text-xs text-green-500">(auto-filled)</span> : '*'}
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Chiefs ML vs Raiders" maxLength={500} rows={2} required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Game Start {isAutoFilled ? <span className="text-xs text-green-500">(auto-filled)</span> : '*'}
          </label>
          <input type="datetime-local" value={gameStartTime} onChange={(e) => setGameStartTime(e.target.value)} required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Available From *</label>
          <input type="datetime-local" value={availableDate} onChange={(e) => setAvailableDate(e.target.value)} required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expires At *</label>
          <input type="datetime-local" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required
            className="w-full px-4 py-2 bg-background border border-gray-800 rounded focus:border-primary focus:outline-none" />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Creating...
          </span>
        ) : 'Create Bonus Pick'}
      </button>
    </form>
  );
}
