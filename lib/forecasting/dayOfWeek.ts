/**
 * Get YYYY-MM-DD for a date in the given IANA timezone.
 */
export function dateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday) for a date in the given timezone.
 */
export function weekdayInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const day = formatter.format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[day] ?? 0;
}

/**
 * Get "today" as YYYY-MM-DD in shop timezone.
 */
export function todayInTimezone(timezone: string): string {
  return dateInTimezone(new Date(), timezone);
}

/**
 * Add days to a YYYY-MM-DD string and return YYYY-MM-DD.
 */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
