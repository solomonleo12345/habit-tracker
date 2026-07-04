import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';

interface UserProfile {
  uid: string;
  email: string;
  approved: boolean;
  createdAt?: string;
}

/**
 * Admin-only screen: review pending registrations and approve/revoke access.
 * Data comes live from the `users` collection (admins can list all per the
 * Firestore security rules).
 */
export function AdminPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[] | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(
        snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) })),
      );
    });
  }, [isAdmin]);

  async function setApproved(uid: string, approved: boolean) {
    setBusyId(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { approved });
    } finally {
      setBusyId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-500">
          You don't have access to this page.
        </p>
      </div>
    );
  }

  const pending = (users ?? []).filter((u) => !u.approved);
  const approvedUsers = (users ?? []).filter((u) => u.approved);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Admin</h1>

      <Section title={`Pending approval (${pending.length})`}>
        {users === undefined ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-slate-400">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((u) => (
              <li key={u.uid} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                  {u.email}
                </span>
                <button
                  type="button"
                  onClick={() => setApproved(u.uid, true)}
                  disabled={busyId === u.uid}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Approved users (${approvedUsers.length})`}>
        {approvedUsers.length === 0 ? (
          <p className="text-sm text-slate-400">No approved users yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {approvedUsers.map((u) => (
              <li key={u.uid} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                  {u.email}
                </span>
                <button
                  type="button"
                  onClick={() => setApproved(u.uid, false)}
                  disabled={busyId === u.uid}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
