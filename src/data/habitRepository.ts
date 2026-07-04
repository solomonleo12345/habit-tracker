import type { BackupPayload, Entry, Habit, StoredStatus } from '../types';
import { todayKey } from '../logic/dates';

/**
 * Data-access contract for the app. UI and hooks depend on THIS interface,
 * so the storage backend can change without touching feature code. The current
 * implementation is Firestore (see `firestoreRepository.ts`), which syncs each
 * user's data across devices and works offline via a persistent local cache.
 */
export interface HabitRepository {
  // Habits
  listHabits(includeArchived?: boolean): Promise<Habit[]>;
  createHabit(input: {
    name: string;
    color: string;
    emoji?: string;
  }): Promise<Habit>;
  updateHabit(
    id: string,
    changes: Partial<Pick<Habit, 'name' | 'color' | 'emoji' | 'order'>>,
  ): Promise<void>;
  archiveHabit(id: string): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  reorderHabits(orderedIds: string[]): Promise<void>;

  // Entries
  listEntries(): Promise<Entry[]>;
  listEntriesForHabit(habitId: string): Promise<Entry[]>;
  /** Set an explicit status for a habit/day. */
  setEntry(habitId: string, date: string, status: StoredStatus): Promise<void>;
  /** Remove a habit/day entry (i.e. set it back to "empty"). */
  clearEntry(habitId: string, date: string): Promise<void>;

  // Backup
  exportAll(): Promise<BackupPayload>;
  importAll(payload: BackupPayload, mode: 'replace' | 'merge'): Promise<void>;
}

import {
  FirestoreHabitRepository,
  DEFAULT_COLORS,
  newId,
} from './firestoreRepository';

/** The single repository instance used throughout the app. */
export const habitRepository: HabitRepository = new FirestoreHabitRepository();

export { DEFAULT_COLORS, newId, todayKey };
