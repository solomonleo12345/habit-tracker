/**
 * Core domain types for the Habit Tracker.
 *
 * Storage model:
 * - A `Habit` is a thing the user wants to do (e.g. "Drink water").
 * - An `Entry` records the status of a habit on a specific day.
 *   The ABSENCE of an entry for a day means "empty" (not tracked / stopped).
 */

/**
 * The explicit status a day can hold.
 * "empty" is represented by the absence of an Entry rather than a stored value,
 * but the union is exported for use in UI/logic where an explicit value is handy.
 */
export type DayStatus = 'ticked' | 'skipped' | 'empty';

/** The two statuses that are actually persisted as an Entry. */
export type StoredStatus = Extract<DayStatus, 'ticked' | 'skipped'>;

export interface Habit {
  /** Stable unique id (uuid). */
  id: string;
  /** Display name, e.g. "Drink 2L water". */
  name: string;
  /** Tailwind-friendly accent color hex, used for cells/charts. */
  color: string;
  /** Optional emoji shown next to the name. */
  emoji?: string;
  /** Manual ordering in the grid (ascending). */
  order: number;
  /** ISO timestamp when created. */
  createdAt: string;
  /** When set, the habit is hidden from the tracker but kept for history. */
  archivedAt?: string;
}

export interface Entry {
  /** Stable unique id (uuid). */
  id: string;
  /** FK -> Habit.id */
  habitId: string;
  /** Local calendar day in `YYYY-MM-DD` format. */
  date: string;
  /** Persisted status; "empty" days simply have no Entry row. */
  status: StoredStatus;
  /** ISO timestamp when last updated. */
  updatedAt: string;
}

/** A single day's computed status for a habit, used by the grid. */
export interface DayCellState {
  date: string;
  status: DayStatus;
}

/** Streak metrics computed for a single habit. */
export interface StreakStats {
  current: number;
  longest: number;
}

/** Completion-rate metrics over a set of windows. */
export interface CompletionStats {
  last7: number;
  last30: number;
  allTime: number;
}

/** Aggregate analytics for a single habit, used on the dashboard. */
export interface HabitAnalytics {
  habit: Habit;
  streak: StreakStats;
  completion: CompletionStats;
  totalTicked: number;
  totalSkipped: number;
}

/** Shape of the JSON backup file for export/import. */
export interface BackupPayload {
  version: 1;
  exportedAt: string;
  habits: Habit[];
  entries: Entry[];
}
