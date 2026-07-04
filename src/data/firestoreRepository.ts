import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { BackupPayload, Entry, Habit, StoredStatus } from '../types';
import type { HabitRepository } from './habitRepository';

/**
 * Firestore-backed implementation of the app's data contract.
 *
 * Data is scoped per authenticated user:
 *   users/{uid}/habits/{habitId}
 *   users/{uid}/entries/{entryId}
 *
 * The uid is read from the current auth session on each call, so the interface
 * stays identical to the local version — the UI and hooks are unaffected.
 */

function uid(): string {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  return u.uid;
}

function habitsCol(userId: string) {
  return collection(db, 'users', userId, 'habits');
}

function entriesCol(userId: string) {
  return collection(db, 'users', userId, 'entries');
}

/** Deterministic entry id => one entry per habit per day. */
function entryId(habitId: string, date: string): string {
  return `${habitId}_${date}`;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const DEFAULT_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ef4444',
  '#f59e0b',
  '#14b8a6',
  '#ec4899',
  '#6366f1',
];

/** Strip `undefined` fields — Firestore rejects them. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T;
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export class FirestoreHabitRepository implements HabitRepository {
  async listHabits(includeArchived = false): Promise<Habit[]> {
    const snap = await getDocs(habitsCol(uid()));
    const all = snap.docs
      .map((d) => d.data() as Habit)
      .sort((a, b) => a.order - b.order);
    return includeArchived ? all : all.filter((h) => !h.archivedAt);
  }

  async createHabit(input: {
    name: string;
    color: string;
    emoji?: string;
  }): Promise<Habit> {
    const userId = uid();
    const existing = await getDocs(habitsCol(userId));
    const count = existing.size;
    const habit: Habit = {
      id: newId(),
      name: input.name.trim(),
      color: input.color || DEFAULT_COLORS[count % DEFAULT_COLORS.length],
      emoji: input.emoji?.trim() || undefined,
      order: count,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(habitsCol(userId), habit.id), clean({ ...habit }));
    return habit;
  }

  async updateHabit(
    id: string,
    changes: Partial<Pick<Habit, 'name' | 'color' | 'emoji' | 'order'>>,
  ): Promise<void> {
    const patch: Record<string, unknown> = { ...changes };
    if (typeof patch.name === 'string') patch.name = patch.name.trim();
    if (typeof patch.emoji === 'string') {
      // Firestore has no `undefined`; clear the emoji with an empty string.
      patch.emoji = (patch.emoji as string).trim();
    }
    await updateDoc(doc(habitsCol(uid()), id), patch);
  }

  async archiveHabit(id: string): Promise<void> {
    await updateDoc(doc(habitsCol(uid()), id), {
      archivedAt: new Date().toISOString(),
    });
  }

  async deleteHabit(id: string): Promise<void> {
    const userId = uid();
    // Remove the habit and all its entries in one atomic batch.
    const entriesSnap = await getDocs(entriesCol(userId));
    const batch = writeBatch(db);
    batch.delete(doc(habitsCol(userId), id));
    entriesSnap.docs.forEach((d) => {
      if ((d.data() as Entry).habitId === id) batch.delete(d.ref);
    });
    await batch.commit();
  }

  async reorderHabits(orderedIds: string[]): Promise<void> {
    const userId = uid();
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(habitsCol(userId), id), { order: index });
    });
    await batch.commit();
  }

  async listEntries(): Promise<Entry[]> {
    const snap = await getDocs(entriesCol(uid()));
    return snap.docs.map((d) => d.data() as Entry);
  }

  async listEntriesForHabit(habitId: string): Promise<Entry[]> {
    const snap = await getDocs(entriesCol(uid()));
    return snap.docs
      .map((d) => d.data() as Entry)
      .filter((e) => e.habitId === habitId);
  }

  async setEntry(
    habitId: string,
    date: string,
    status: StoredStatus,
  ): Promise<void> {
    const userId = uid();
    const id = entryId(habitId, date);
    const entry: Entry = {
      id,
      habitId,
      date,
      status,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(entriesCol(userId), id), entry);
  }

  async clearEntry(habitId: string, date: string): Promise<void> {
    await deleteDoc(doc(entriesCol(uid()), entryId(habitId, date)));
  }

  async exportAll(): Promise<BackupPayload> {
    const userId = uid();
    const [habitsSnap, entriesSnap] = await Promise.all([
      getDocs(habitsCol(userId)),
      getDocs(entriesCol(userId)),
    ]);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: habitsSnap.docs.map((d) => d.data() as Habit),
      entries: entriesSnap.docs.map((d) => d.data() as Entry),
    };
  }

  async importAll(
    payload: BackupPayload,
    mode: 'replace' | 'merge',
  ): Promise<void> {
    if (payload.version !== 1) {
      throw new Error(`Unsupported backup version: ${payload.version}`);
    }
    const userId = uid();
    const batch = writeBatch(db);

    if (mode === 'replace') {
      const [habitsSnap, entriesSnap] = await Promise.all([
        getDocs(habitsCol(userId)),
        getDocs(entriesCol(userId)),
      ]);
      habitsSnap.docs.forEach((d) => batch.delete(d.ref));
      entriesSnap.docs.forEach((d) => batch.delete(d.ref));
    }

    for (const habit of payload.habits) {
      batch.set(doc(habitsCol(userId), habit.id), clean({ ...habit }));
    }
    for (const entry of payload.entries) {
      const id = entry.id || entryId(entry.habitId, entry.date);
      batch.set(doc(entriesCol(userId), id), clean({ ...entry, id }));
    }
    await batch.commit();
  }
}

export { DEFAULT_COLORS, newId };
