import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import type { Entry } from '../types';

/** Subscribe to the current user's entries; calls back with the full list. */
function subscribeEntries(onData: (entries: Entry[]) => void): () => void {
  let unsubDoc: (() => void) | undefined;
  const unsubAuth = onAuthStateChanged(auth, (user) => {
    unsubDoc?.();
    if (!user) {
      onData([]);
      return;
    }
    const col = collection(db, 'users', user.uid, 'entries');
    unsubDoc = onSnapshot(col, (snap) => {
      onData(snap.docs.map((d) => d.data() as Entry));
    });
  });
  return () => {
    unsubDoc?.();
    unsubAuth();
  };
}

/**
 * Live list of every entry for the current user across all habits.
 * Returns `undefined` while the initial snapshot is loading.
 */
export function useAllEntries(): Entry[] | undefined {
  const [entries, setEntries] = useState<Entry[] | undefined>(undefined);
  useEffect(() => subscribeEntries(setEntries), []);
  return entries;
}

/**
 * Live map of habitId -> that habit's entries.
 * Convenient for the grid and dashboard which key off a single habit.
 */
export function useEntriesByHabit(): Map<string, Entry[]> | undefined {
  const [map, setMap] = useState<Map<string, Entry[]> | undefined>(undefined);
  useEffect(() => {
    return subscribeEntries((entries) => {
      const next = new Map<string, Entry[]>();
      for (const entry of entries) {
        const list = next.get(entry.habitId);
        if (list) list.push(entry);
        else next.set(entry.habitId, [entry]);
      }
      setMap(next);
    });
  }, []);
  return map;
}
