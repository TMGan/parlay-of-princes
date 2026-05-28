export type OddsFormat = "american" | "decimal";

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

export function getWeekNumber(dateInput: Date | string | number): number {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  return Math.min(52, Math.max(1, Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)));
}
