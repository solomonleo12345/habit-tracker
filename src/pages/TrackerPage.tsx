import { useState } from 'react';
import type { DayStatus, Habit } from '../types';
import { useHabits } from '../hooks/useHabits';
import { useEntriesByHabit } from '../hooks/useEntries';
import { habitRepository } from '../data/habitRepository';
import { HabitGrid } from '../components/HabitGrid';
import { AddHabitDialog } from '../components/AddHabitDialog';
import { CheckIcon, PlusIcon } from '../components/icons';
import type { DayKey } from '../logic/dates';

export function TrackerPage() {
  const habits = useHabits();
  const entriesByHabit = useEntriesByHabit();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const loading = habits === undefined || entriesByHabit === undefined;

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(habit: Habit) {
    setEditing(habit);
    setDialogOpen(true);
  }

  async function handleCellChange(
    habitId: string,
    date: DayKey,
    status: DayStatus,
  ) {
    if (status === 'empty') {
      await habitRepository.clearEntry(habitId, date);
    } else {
      await habitRepository.setEntry(habitId, date, status);
    }
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Habits</h1>
          <p className="text-sm text-slate-500">
            Tap a day to cycle: done → skip → empty
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          <PlusIcon width={18} height={18} />
          Add
        </button>
      </header>

      <Legend />

      {loading ? (
        <GridSkeleton />
      ) : habits.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <HabitGrid
          habits={habits}
          entriesByHabit={entriesByHabit}
          onCellChange={handleCellChange}
          onEditHabit={openEdit}
        />
      )}

      <AddHabitDialog
        open={dialogOpen}
        habit={editing}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

function Legend() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-green-600 text-white">
          <CheckIcon width={11} height={11} strokeWidth={3} />
        </span>
        Done
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-400">
          <span className="h-0.5 w-2 rounded-full bg-white" />
        </span>
        Skipped
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-4 w-4 rounded border border-slate-300 bg-slate-50" />
        Empty
      </span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
        <CheckIcon width={28} height={28} strokeWidth={2.5} />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">No habits yet</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
        Add your first habit and start building your streaks.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
      >
        <PlusIcon width={18} height={18} />
        Add your first habit
      </button>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4 h-4 w-24 rounded bg-slate-100" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-3 flex items-center gap-2">
          <div className="h-6 w-28 rounded bg-slate-100" />
          <div className="h-11 w-11 rounded-xl bg-slate-100" />
          <div className="h-11 w-11 rounded-xl bg-slate-100" />
          <div className="h-11 w-11 rounded-xl bg-slate-100" />
          <div className="h-11 w-11 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
