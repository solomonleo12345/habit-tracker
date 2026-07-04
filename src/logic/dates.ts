import {
  addDays as addDaysFn,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from 'date-fns';

/**
 * A "day key" is a local calendar day formatted as `YYYY-MM-DD`.
 * We standardize on local time so a habit ticked at 11pm belongs to that day,
 * not the next UTC day.
 */
export type DayKey = string;

/** Format a Date as a local `YYYY-MM-DD` key. */
export function toDayKey(date: Date): DayKey {
  return format(date, 'yyyy-MM-dd');
}

/** Parse a `YYYY-MM-DD` key into a local Date at midnight. */
export function fromDayKey(key: DayKey): Date {
  return startOfDay(parseISO(key));
}

/** Today's local day key. */
export function todayKey(): DayKey {
  return toDayKey(new Date());
}

/** Add (or subtract, with a negative n) days to a key, returning a new key. */
export function addDays(key: DayKey, n: number): DayKey {
  return toDayKey(addDaysFn(fromDayKey(key), n));
}

/**
 * Whole calendar days from `a` to `b` (b - a).
 * Positive when `b` is after `a`.
 */
export function diffDays(a: DayKey, b: DayKey): number {
  return differenceInCalendarDays(fromDayKey(b), fromDayKey(a));
}

/**
 * Build an ascending array of `count` day keys ending at `endKey` (inclusive).
 * e.g. rangeEndingAt('2024-01-05', 3) -> ['2024-01-03','2024-01-04','2024-01-05'].
 */
export function rangeEndingAt(endKey: DayKey, count: number): DayKey[] {
  const keys: DayKey[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(addDays(endKey, -i));
  }
  return keys;
}

/**
 * Build an ascending array of day keys from `startKey` to `endKey` inclusive.
 */
export function rangeBetween(startKey: DayKey, endKey: DayKey): DayKey[] {
  const total = diffDays(startKey, endKey);
  if (total < 0) return [];
  const keys: DayKey[] = [];
  for (let i = 0; i <= total; i++) {
    keys.push(addDays(startKey, i));
  }
  return keys;
}

/** Human day-of-month, e.g. "5". */
export function formatDayOfMonth(key: DayKey): string {
  return format(fromDayKey(key), 'd');
}

/** Short weekday, e.g. "Mon". */
export function formatWeekday(key: DayKey): string {
  return format(fromDayKey(key), 'EEE');
}

/** Short month + day, e.g. "Jan 5". */
export function formatMonthDay(key: DayKey): string {
  return format(fromDayKey(key), 'MMM d');
}

/** True if the key is today (local). */
export function isToday(key: DayKey): boolean {
  return key === todayKey();
}
