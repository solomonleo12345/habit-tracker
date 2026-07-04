import type { DayStatus, Entry, StreakStats } from '../types';
import {
  addDays,
  diffDays,
  rangeBetween,
  todayKey,
  type DayKey,
} from './dates';

/**
 * Streak rules (confirmed):
 * - `ticked`  = habit done. Counts as +1 toward the streak.
 * - `skipped` = intentional day off. Preserves the streak but does NOT add to
 *               the count. TWO consecutive skips break the streak.
 * - `empty`   = stopped. Breaks the streak (must restart).
 * - Today: an untouched (empty) today is "pending", not a break. We evaluate
 *          the current streak as of yesterday in that case.
 */

/** Build a fast lookup of day -> status from a habit's entries. */
export function buildStatusMap(entries: Entry[]): Map<DayKey, DayStatus> {
  const map = new Map<DayKey, DayStatus>();
  for (const entry of entries) {
    map.set(entry.date, entry.status);
  }
  return map;
}

function statusOn(map: Map<DayKey, DayStatus>, key: DayKey): DayStatus {
  return map.get(key) ?? 'empty';
}

function earliestDate(entries: Entry[], fallback: DayKey): DayKey {
  return entries.reduce(
    (min, e) => (e.date < min ? e.date : min),
    fallback,
  );
}

function latestDate(entries: Entry[], fallback: DayKey): DayKey {
  return entries.reduce(
    (max, e) => (e.date > max ? e.date : max),
    fallback,
  );
}

/**
 * The ongoing streak ending at (or just before) today.
 * Walks backward from today, honoring the skip rules above.
 */
export function currentStreak(
  entries: Entry[],
  today: DayKey = todayKey(),
): number {
  if (entries.length === 0) return 0;

  const map = buildStatusMap(entries);
  const earliest = earliestDate(entries, today);

  // An empty today is pending: begin the walk at yesterday instead.
  let cursor = statusOn(map, today) === 'empty' ? addDays(today, -1) : today;

  let streak = 0;
  let consecutiveSkips = 0;

  while (diffDays(earliest, cursor) >= 0) {
    const status = statusOn(map, cursor);
    if (status === 'ticked') {
      streak += 1;
      consecutiveSkips = 0;
    } else if (status === 'skipped') {
      consecutiveSkips += 1;
      if (consecutiveSkips >= 2) break; // two skips in a row breaks it
    } else {
      break; // empty -> stopped
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/**
 * The longest streak ever achieved across the habit's full history.
 * Scans every day between the first and last recorded entry.
 */
export function longestStreak(
  entries: Entry[],
  today: DayKey = todayKey(),
): number {
  if (entries.length === 0) return 0;

  const map = buildStatusMap(entries);
  const start = earliestDate(entries, today);
  const end = latestDate(entries, today);

  let longest = 0;
  let run = 0;
  let consecutiveSkips = 0;

  for (const key of rangeBetween(start, end)) {
    const status = statusOn(map, key);
    if (status === 'ticked') {
      run += 1;
      consecutiveSkips = 0;
      if (run > longest) longest = run;
    } else if (status === 'skipped') {
      consecutiveSkips += 1;
      if (consecutiveSkips >= 2) {
        run = 0; // two skips break the run
      }
    } else {
      run = 0;
      consecutiveSkips = 0;
    }
  }

  return longest;
}

/** Convenience: both metrics in one pass-friendly call. */
export function computeStreaks(
  entries: Entry[],
  today: DayKey = todayKey(),
): StreakStats {
  return {
    current: currentStreak(entries, today),
    longest: longestStreak(entries, today),
  };
}
