import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BackupPayload, Habit } from '../types';
import { habitRepository } from '../data/habitRepository';
import { useAuth } from '../auth/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { todayKey } from '../logic/dates';
import {
  DownloadIcon,
  LogOutIcon,
  PencilIcon,
  UploadIcon,
} from '../components/icons';
import { AddHabitDialog } from '../components/AddHabitDialog';

export function SettingsPage() {
  const { user, logout, isAdmin } = useAuth();
  const habits = useHabits();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModeRef = useRef<'merge' | 'replace'>('merge');
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Habit | null>(null);

  async function handleExport() {
    const payload = await habitRepository.exportAll();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Backup downloaded.');
  }

  function pickFile(mode: 'merge' | 'replace') {
    importModeRef.current = mode;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    const mode = importModeRef.current;
    if (
      mode === 'replace' &&
      !window.confirm(
        'Replace ALL current habits and history with the backup? This cannot be undone.',
      )
    ) {
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;
      if (
        payload?.version !== 1 ||
        !Array.isArray(payload.habits) ||
        !Array.isArray(payload.entries)
      ) {
        throw new Error('Not a valid habit-tracker backup file.');
      }
      await habitRepository.importAll(payload, mode);
      setMessage(
        `Imported ${payload.habits.length} habit(s) and ${payload.entries.length} entries (${mode}).`,
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? `Import failed: ${err.message}` : 'Import failed.',
      );
    }
  }

  async function move(habit: Habit, direction: -1 | 1) {
    if (!habits) return;
    const index = habits.findIndex((h) => h.id === habit.id);
    const target = index + direction;
    if (target < 0 || target >= habits.length) return;
    const reordered = [...habits];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await habitRepository.reorderHabits(reordered.map((h) => h.id));
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Account */}
      <Section title="Account">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-800">
              {user?.email ?? 'Guest'}
            </div>
            <div className="text-xs text-slate-400">
              {isAdmin ? 'Admin account' : 'Signed in'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <LogOutIcon width={18} height={18} />
            Log out
          </button>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <span>Manage users &amp; approvals</span>
            <span aria-hidden>&rarr;</span>
          </Link>
        )}
      </Section>

      {/* Manage habits */}
      <Section title="Manage habits">
        {!habits || habits.length === 0 ? (
          <p className="text-sm text-slate-400">No habits yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {habits.map((habit, index) => (
              <li key={habit.id} className="flex items-center gap-2 py-2">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: habit.color }}
                  aria-hidden
                />
                {habit.emoji && <span>{habit.emoji}</span>}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                  {habit.name}
                </span>
                <button
                  type="button"
                  onClick={() => move(habit, -1)}
                  disabled={index === 0}
                  className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(habit, 1)}
                  disabled={index === habits.length - 1}
                  className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(habit)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Edit habit"
                >
                  <PencilIcon width={18} height={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Backup */}
      <Section title="Backup & restore">
        <p className="mb-3 text-sm text-slate-500">
          Your data is stored only on this device. Export a backup regularly so
          you don't lose your history.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            <DownloadIcon width={18} height={18} />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => pickFile('merge')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <UploadIcon width={18} height={18} />
            Import (merge)
          </button>
          <button
            type="button"
            onClick={() => pickFile('replace')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <UploadIcon width={18} height={18} />
            Import (replace)
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileSelected}
        />
      </Section>

      <p className="pt-2 text-center text-xs text-slate-400">
        Habit Tracker · local-first · v0.1
      </p>

      <AddHabitDialog
        open={editing !== null}
        habit={editing}
        onClose={() => setEditing(null)}
      />
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
