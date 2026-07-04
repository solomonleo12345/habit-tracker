import { useEffect, useState } from 'react';
import type { Habit } from '../types';
import { DEFAULT_COLORS, habitRepository } from '../data/habitRepository';
import { TrashIcon, XIcon } from './icons';

interface AddHabitDialogProps {
  open: boolean;
  /** When provided, the dialog edits this habit instead of creating one. */
  habit?: Habit | null;
  onClose: () => void;
}

const EMOJI_SUGGESTIONS = ['💧', '🏃', '📚', '🧘', '💪', '🥗', '😴', '🧹', '✍️', '🎯'];

/** Modal for creating or editing (and deleting) a habit. */
export function AddHabitDialog({ open, habit, onClose }: AddHabitDialogProps) {
  const isEdit = Boolean(habit);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync fields when the dialog opens or target habit changes.
  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? '');
    setEmoji(habit?.emoji ?? '');
    setColor(habit?.color ?? DEFAULT_COLORS[0]);
    setError(null);
  }, [open, habit]);

  if (!open) return null;

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a habit name.');
      return;
    }
    setSaving(true);
    try {
      if (habit) {
        await habitRepository.updateHabit(habit.id, {
          name: trimmed,
          emoji,
          color,
        });
      } else {
        await habitRepository.createHabit({ name: trimmed, emoji, color });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!habit) return;
    const confirmed = window.confirm(
      `Delete "${habit.name}" and all its history? This cannot be undone.`,
    );
    if (!confirmed) return;
    setSaving(true);
    try {
      await habitRepository.deleteHabit(habit.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit habit' : 'New habit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <XIcon width={20} height={20} />
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Drink 2L water"
          className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <label className="mb-1 block text-sm font-medium text-slate-600">
          Emoji <span className="text-slate-400">(optional)</span>
        </label>
        <div className="mb-4 flex items-center gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
            placeholder="🙂"
            className="w-16 rounded-xl border border-slate-300 px-3 py-2.5 text-center text-xl outline-none focus:border-green-500"
          />
          <div className="flex flex-wrap gap-1">
            {EMOJI_SUGGESTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className="rounded-lg px-1.5 py-1 text-xl hover:bg-slate-100"
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-600">
          Color
        </label>
        <div className="mb-5 flex flex-wrap gap-2">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Select color ${c}`}
              className={`h-9 w-9 rounded-full transition ${
                color === c ? 'ring-2 ring-slate-800 ring-offset-2' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
          >
            {isEdit ? 'Save changes' : 'Add habit'}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              aria-label="Delete habit"
            >
              <TrashIcon width={22} height={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
