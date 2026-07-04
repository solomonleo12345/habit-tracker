import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import type { Habit } from '../types';

/**
 * Live list of the current user's habits, ordered by their manual `order`.
 * Backed by a Firestore real-time listener (with offline cache). Returns
 * `undefined` while the initial snapshot is loading.
 */
export function useHabits(includeArchived = false): Habit[] | undefined {
  const [habits, setHabits] = useState<Habit[] | undefined>(undefined);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubDoc?.();
      if (!user) {
        setHabits([]);
        return;
      }
      const col = collection(db, 'users', user.uid, 'habits');
      unsubDoc = onSnapshot(col, (snap) => {
        const all = snap.docs
          .map((d) => d.data() as Habit)
          .sort((a, b) => a.order - b.order);
        setHabits(includeArchived ? all : all.filter((h) => !h.archivedAt));
      });
    });

    return () => {
      unsubDoc?.();
      unsubAuth();
    };
  }, [includeArchived]);

  return habits;
}
