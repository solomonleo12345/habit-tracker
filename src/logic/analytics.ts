import type {
  CompletionStats,
  Entry,
  Habit,
  HabitAnalytics,
} from '../types';
import { computeStreaks } from './streak';
import {
  diffDays,
  rangeEndingAt,
  todayKey,
  type DayKey,
} from './dates';

/**
 * Completion rate = ticked days / total calendar days in the window.
 * Skipped days are intentional days off and are treated as "not completed"
 * for rate purposes (they still protect the streak elsewhere).
 * Returned as a 0..1 fraction.
 */
export function completionRate(
  entries: Entry[],
  windowDays: number,
  today: DayKey = todayKey(),
): number {
  if (windowDays <= 0) return 0;
  const keys = new Set(rangeEndingAt(today, windowDays));
  let ticked = 0;
  for (const entry of entries) {
    if (entry.status === 'ticked' && keys.has(entry.date)) ticked += 1;
  }
  return ticked / windowDays;
}

/** All-time completion rate from the first recorded entry through today. */
export function allTimeCompletion(
  entries: Entry[],
  today: DayKey = todayKey(),
): number {
  if (entries.length === 0) return 0;
  const earliest = entries.reduce(
    (min, e) => (e.date < min ? e.date : min),
    today,
  );
  const totalDays = diffDays(earliest, today) + 1;
  if (totalDays <= 0) return 0;
  const ticked = entries.filter((e) => e.status === 'ticked').length;
  return ticked / totalDays;
}

/** Completion rates across the standard windows (7 / 30 / all-time). */
export function completionStats(
  entries: Entry[],
  today: DayKey = todayKey(),
): CompletionStats {
  return {
    last7: completionRate(entries, 7, today),
    last30: completionRate(entries, 30, today),
    allTime: allTimeCompletion(entries, today),
  };
}

/** Count ticked and skipped entries. */
export function countByStatus(entries: Entry[]): {
  ticked: number;
  skipped: number;
} {
  let ticked = 0;
  let skipped = 0;
  for (const entry of entries) {
    if (entry.status === 'ticked') ticked += 1;
    else if (entry.status === 'skipped') skipped += 1;
  }
  return { ticked, skipped };
}

/** Aggregate everything the dashboard needs for one habit. */
export function computeHabitAnalytics(
  habit: Habit,
  entries: Entry[],
  today: DayKey = todayKey(),
): HabitAnalytics {
  const { ticked, skipped } = countByStatus(entries);
  return {
    habit,
    streak: computeStreaks(entries, today),
    completion: completionStats(entries, today),
    totalTicked: ticked,
    totalSkipped: skipped,
  };
}

/**
 * Rank habits by recent (30-day) completion, tie-broken by current streak.
 * Returns a new array sorted best-first.
 */
export function rankByPerformance(list: HabitAnalytics[]): HabitAnalytics[] {
  return [...list].sort((a, b) => {
    if (b.completion.last30 !== a.completion.last30) {
      return b.completion.last30 - a.completion.last30;
    }
    return b.streak.current - a.streak.current;
  });
}

export interface DailyCompletion {
  date: DayKey;
  ticked: number;
  skipped: number;
  /** Number of habits that existed (were created) on/before this day. */
  active: number;
  /** ticked / active, 0..1 (0 when no active habits). */
  rate: number;
}

/**
 * Per-day completion aggregated across habits, used by the calendar heatmap
 * and the weekly/monthly charts. A habit only counts toward `active` on days
 * on/after it was created (and before it was archived).
 */
export function dailyCompletion(
  habitsWithEntries: { habit: Habit; entries: Entry[] }[],
  keys: DayKey[],
): DailyCompletion[] {
  // Pre-index statuses per day, and compute each habit's effective start =
  // earliest of its creation day or any (possibly backfilled) entry, so
  // backdated days still count toward the "active" denominator.
  const perDay = new Map<DayKey, { ticked: number; skipped: number }>();
  const startByHabit = new Map<string, DayKey>();
  for (const { habit, entries } of habitsWithEntries) {
    let start = habit.createdAt.slice(0, 10);
    for (const entry of entries) {
      if (entry.date < start) start = entry.date;
      const bucket = perDay.get(entry.date) ?? { ticked: 0, skipped: 0 };
      if (entry.status === 'ticked') bucket.ticked += 1;
      else if (entry.status === 'skipped') bucket.skipped += 1;
      perDay.set(entry.date, bucket);
    }
    startByHabit.set(habit.id, start);
  }

  return keys.map((date) => {
    const counts = perDay.get(date) ?? { ticked: 0, skipped: 0 };
    const active = habitsWithEntries.filter(({ habit }) => {
      const startedBeforeOrOn = (startByHabit.get(habit.id) ?? date) <= date;
      const archivedAfter =
        !habit.archivedAt || habit.archivedAt.slice(0, 10) > date;
      return startedBeforeOrOn && archivedAfter;
    }).length;

    return {
      date,
      ticked: counts.ticked,
      skipped: counts.skipped,
      active,
      rate: active > 0 ? counts.ticked / active : 0,
    };
  });
}

/** Format a 0..1 fraction as a rounded percentage string, e.g. "83%". */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
