export type OddsFormat = "american" | "decimal";

const DEFAULT_LOCALE = "en-US";

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
