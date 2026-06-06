export type OddsFormat = "american" | "decimal";

/**
 * Convert a date + time entered as Eastern Time wall-clock values into a UTC ISO string.
 *
 * Problem this solves: `new Date("YYYY-MM-DDTHH:MM")` without a timezone suffix is
 * parsed as LOCAL time by the browser.  If the browser is not in ET, any game start
 * time the AI returns (which is always ET) will be stored with the wrong UTC offset.
 *
 * Algorithm (handles both EST −5 and EDT −4 automatically via IANA database):
 *  1. Treat the ET values as if they were UTC ("fake UTC").
 *  2. Format that fake-UTC instant in ET to see what ET clock it actually represents.
 *  3. The difference between step-1 and step-2 is the ET UTC offset at that moment.
 *  4. Add the offset back → true UTC.
 *
 * @param dateStr "YYYY-MM-DD"
 * @param timeStr "HH:MM"
 * @returns ISO 8601 UTC string, e.g. "2026-06-05T23:08:00.000Z"
 */
export function etWallClockToISO(dateStr: string, timeStr: string): string {
  // Step 1 — fake UTC: treat the ET clock values as if they were already UTC
  const fakeUTC = new Date(`${dateStr}T${timeStr}:00Z`);
  if (Number.isNaN(fakeUTC.getTime())) return new Date(0).toISOString();

  // Step 2 — what ET wall clock does this fake-UTC instant correspond to?
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(fakeUTC);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const etAsUTC = new Date(
    `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:00Z`
  );

  // Step 3 — offset in ms (e.g. 4 h for EDT, 5 h for EST)
  const offsetMs = fakeUTC.getTime() - etAsUTC.getTime();

  // Step 4 — true UTC = fake UTC + offset
  return new Date(fakeUTC.getTime() + offsetMs).toISOString();
}

const DEFAULT_LOCALE = "en-US";

// ─── Eastern Time helpers ────────────────────────────────────────────────────
// All user-facing dates and times in the app are displayed in ET so that
// everyone sees the same clock regardless of where they are.
const ET = 'America/New_York';

/**
 * Format a date-only string in ET, e.g. "May 28, 2026".
 * Pass custom Intl options to adjust the fields shown.
 */
export function formatDateET(
  dateInput: Date | string | number,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, { ...options, timeZone: ET }).format(date);
}

/**
 * Format a time-only string in ET, e.g. "8:00 PM".
 */
export function formatTimeET(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Invalid time';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: ET,
  }).format(date);
}

/**
 * Format a combined date-time string in ET, e.g. "May 28, 8:00 PM".
 */
export function formatDateTimeET(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: ET,
  }).format(date);
}

export function formatOdds(value: number, format: OddsFormat = "american"): string {
  if (!Number.isFinite(value)) {
    return "N/A";
  }

  if (format === "decimal") {
    return value.toFixed(2);
  }

  const odds = Math.round(value);
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatDate(
  dateInput: Date | string | number,
  locale: string = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric"
  }
): string {
  const date = new Date(dateInput);
  return Number.isNaN(date.getTime())
    ? "Invalid date"
    : new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatPoints(points: number, precision = 0): string {
  if (!Number.isFinite(points)) {
    return "N/A";
  }

  const formatted = points.toFixed(precision);
  return points > 0 ? `+${formatted}` : formatted;
}

/**
 * Returns the Mon–Sun date range string for a given week number, e.g. "5/26/26–6/1/26".
 * Pass the same Date you used to compute the week number so the year is consistent.
 */
export function formatWeekRange(weekNumber: number, dateInput: Date | string | number = new Date()): string {
  const date = new Date(dateInput);

  // Resolve the ET year for the reference date
  const etYearStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
  }).format(date);
  const year = Number(etYearStr);

  // Use UTC so DST never skews the day-of-week for Jan 1.
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Day = (jan1.getUTCDay() + 6) % 7;

  // First day of this week (days offset from Jan 1)
  const startOffset = Math.max(0, (weekNumber - 1) * 7 - jan1Day);
  const start = new Date(year, 0, 1 + startOffset);
  const end   = new Date(year, 0, 1 + startOffset + 6);

  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;

  return `${fmt(start)}–${fmt(end)}`;
}

export function getWeekNumber(dateInput: Date | string | number): number {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  // Convert to Eastern Time before computing week number.
  // Vercel runs in UTC — without this, late-night EST times (e.g. 11 PM EST = 4 AM UTC next day)
  // would roll over to the next day/week prematurely.
  const etString = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // "YYYY-MM-DD"

  const [year, month, day] = etString.split('-').map(Number) as [number, number, number];

  // Use UTC dates so DST never affects the millisecond arithmetic.
  // The ET year/month/day are already resolved above; we just need timezone-clean offsets.
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const utcJan1 = new Date(Date.UTC(year, 0, 1));
  const pastDaysOfYear = Math.floor((utcDate.getTime() - utcJan1.getTime()) / 86400000);
  // (getUTCDay() + 6) % 7 converts Sun=0…Sat=6 → Mon=0…Sun=6, anchoring weeks on Monday.
  const monOffset = (utcJan1.getUTCDay() + 6) % 7;
  return Math.min(52, Math.max(1, Math.ceil((pastDaysOfYear + monOffset + 1) / 7)));
}
