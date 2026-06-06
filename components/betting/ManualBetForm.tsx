'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera, X } from 'lucide-react';
import { MANUAL_SPORTS } from '@/lib/constants/sports';
import { etWallClockToISO } from '@/lib/utils/format';

interface ManualBetFormProps {
  userId: string;
  currentWeek: number;
  leagueId: string;
  canPlaceRegularBet: boolean;
  canPlaceKingLock: boolean;
}

export function ManualBetForm(props: ManualBetFormProps) {
  const { canPlaceRegularBet, canPlaceKingLock, leagueId } = props;
  const router = useRouter();

  // Form state
  const [isExpanded, setIsExpanded] = useState(false);
  const [sport, setSport] = useState('');
  const [customSport, setCustomSport] = useState('');
  const [description, setDescription] = useState('');
  const [odds, setOdds] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameTime, setGameTime] = useState('20:00');
  const [isKingLock, setIsKingLock] = useState(false);

  // Screenshot state
  const [isParsingSlip, setIsParsingSlip] = useState(false);
  const [slipError, setSlipError] = useState('');
  const [slipSuccess, setSlipSuccess] = useState(false);
  const [slipImageDataUrl, setSlipImageDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading & errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  /** Compress an image file to a JPEG data URL (max 1200px wide, 80% quality). */
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_PX = 1200;
        const scale = Math.min(1, MAX_PX / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    });

  const handleScreenshotUpload = async (file: File) => {
    setIsParsingSlip(true);
    setSlipError('');
    setSlipSuccess(false);
    setSlipImageDataUrl(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] ?? result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Parse the slip and compress for storage in parallel
      const [res, compressed] = await Promise.all([
        fetch('/api/ai/parse-bet-slip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        }),
        compressImage(file),
      ]);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse slip');

      // Auto-fill fields from parsed slip.
      // gameStartTime is returned as "YYYY-MM-DDTHH:MM" already in ET,
      // so we slice directly — no Date conversion needed to avoid timezone drift.
      if (data.sport) setSport(MANUAL_SPORTS.includes(data.sport) ? data.sport : 'Other');
      if (data.sport && !MANUAL_SPORTS.includes(data.sport)) setCustomSport(data.sport);
      if (data.description) setDescription(data.description);
      if (data.oddsAmerican) setOdds(String(data.oddsAmerican));
      if (typeof data.gameStartTime === 'string' && data.gameStartTime.length >= 16) {
        setGameDate(data.gameStartTime.slice(0, 10));   // "YYYY-MM-DD"
        setGameTime(data.gameStartTime.slice(11, 16));  // "HH:MM"
      }
      if (compressed) setSlipImageDataUrl(compressed);
      setSlipSuccess(true);
      if (!isExpanded) setIsExpanded(true);
    } catch (err) {
      setSlipError(err instanceof Error ? err.message : 'Could not read slip');
    } finally {
      setIsParsingSlip(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const resolvedSport = sport === 'Other' ? customSport.trim() : sport;
      if (!resolvedSport || !description || !odds || !gameDate) {
        throw new Error('All fields are required');
      }

      const oddsNumber = parseInt(odds);
      if (isNaN(oddsNumber) || oddsNumber < 100 || oddsNumber > 10000) {
        throw new Error('Odds must be between +100 and +10000');
      }

      if (description.length > 500) {
        throw new Error('Description must be 500 characters or less');
      }

      // Treat entered date/time as Eastern Time — the AI returns ET wall-clock times
      // and users enter times in ET. Using new Date() without a timezone suffix
      // would interpret the value as local time, which is wrong for non-ET browsers.
      const gameStartTimeISO = etWallClockToISO(gameDate, gameTime);
      if (gameStartTimeISO === new Date(0).toISOString()) {
        throw new Error('Invalid game time');
      }

      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: resolvedSport,
          description: description.trim(),
          oddsAmerican: oddsNumber,
          gameStartTime: gameStartTimeISO,
          isKingLock,
          leagueId,
          betSlipImage: slipImageDataUrl ?? undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place bet');
      }

      // Reset form
      setSport('');
      setCustomSport('');
      setDescription('');
      setOdds('');
      setGameDate('');
      setGameTime('20:00');
      setIsKingLock(false);
      setIsExpanded(false);
      setSlipSuccess(false);
      setSlipImageDataUrl(null);

      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (isKingLock ? canPlaceKingLock : canPlaceRegularBet);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full px-4 py-3 bg-background border border-gray-800 rounded-full hover:border-primary transition-colors text-sm font-medium"
      >
        📝 Enter Bet Manually
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">Manual Entry</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-xs text-gray-400 hover:text-white"
        >
          ✕ Close
        </button>
      </div>

      {/* Screenshot upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleScreenshotUpload(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsingSlip}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-dashed border-primary/40 text-sm text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {isParsingSlip ? (
            <><Loader2 size={15} className="animate-spin" /> Reading slip…</>
          ) : (
            <><Camera size={15} /> Upload Bet Slip Screenshot</>
          )}
        </button>
        {slipError && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <X size={12} /> {slipError}
          </p>
        )}
        {slipSuccess && !slipError && (
          <p className="text-xs text-green-400 mt-1 text-center">
            ✓ Slip read — review the fields below and adjust if needed
          </p>
        )}
        {!slipError && !slipSuccess && !isParsingSlip && (
          <p className="text-xs text-gray-500 mt-1 text-center">AI will auto-fill the fields below</p>
        )}
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent text-accent px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Sport Dropdown */}
      <div>
        <label htmlFor="sport" className="block text-sm font-medium mb-2">
          Sport *
        </label>
        <select
          id="sport"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none"
          required
        >
          <option value="">Select sport...</option>
          {MANUAL_SPORTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="Other">Other</option>
        </select>
        {sport === 'Other' && (
          <input
            type="text"
            value={customSport}
            onChange={(e) => setCustomSport(e.target.value)}
            placeholder="Enter sport name..."
            maxLength={50}
            required
            className="w-full mt-2 px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none"
          />
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Bet Description *
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Patrick Mahomes Over 2.5 TD Passes"
          maxLength={500}
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none"
          required
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
      </div>

      {/* Odds */}
      <div>
        <label htmlFor="odds" className="block text-sm font-medium mb-2">
          Odds (American) *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+</span>
          <input
            id="odds"
            type="number"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            placeholder="150"
            min={100}
            max={10000}
            className="w-full pl-8 pr-4 py-2 bg-background border border-gray-800 rounded-xl focus:border-primary focus:outline-none"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Must be between +100 and +10000</p>
      </div>

      {/* Game Date + Time (split for better UX) */}
      <div>
        <label className="block text-sm font-medium mb-2">Game Start *</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            className="px-3 py-2 bg-background border border-gray-800 rounded-xl text-sm focus:border-primary focus:outline-none"
            required
          />
          <input
            type="time"
            value={gameTime}
            onChange={(e) => setGameTime(e.target.value)}
            className="px-3 py-2 bg-background border border-gray-800 rounded-xl text-sm focus:border-primary focus:outline-none"
            required
          />
        </div>
      </div>

      {/* King Lock */}
      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="manualKingLock"
          checked={isKingLock}
          onChange={(e) => setIsKingLock(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="manualKingLock" className="text-sm">
          Make this my 👑 <span className="font-bold text-primary">King Lock</span> (2x points)
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="btn-primary w-full disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <Loader2 className="animate-spin mr-2" size={16} />
            Placing Bet...
          </span>
        ) : (
          'Place Bet'
        )}
      </button>

      {!canSubmit && (
        <p className="text-sm text-yellow-500">
          {isKingLock
            ? 'You have already placed your King Lock for this week'
            : 'You have placed all 3 regular bets for this week'}
        </p>
      )}
    </form>
  );
}
