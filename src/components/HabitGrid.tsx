import { useEffect, useMemo, useRef } from 'react';
import type { DayStatus, Entry, Habit } from '../types';
import {
  addDays,
  diffDays,
  formatDayOfMonth,
  formatWeekday,
  isToday as isTodayKey,
  rangeBetween,
  todayKey,
  type DayKey,
} from '../logic/dates';
import { useElementWidth, useMediaQuery } from '../hooks/useUi';
import { HabitRow } from './HabitRow';

interface HabitGridProps {
  habits: Habit[];
  entriesByHabit: Map<string, Entry[]>;
  onCellChange: (habitId: string, date: DayKey, status: DayStatus) => void;
  onEditHabit: (habit: Habit) => void;
}

const GAP = 6;
const MAX_DAYS = 400;
/** Always offer at least this much scrollable past for backfilling. */
const MIN_HISTORY_DAYS = 90;
const MIN_CELL = 44;
const MAX_CELL = 84;

/**
 * The tracking grid. Habits are rows; days are columns. The habit-name column
 * is sticky while dates scroll horizontally. Exactly 4 days are visible on
 * phones and 7 on wider screens; older days are reachable by scrolling left.
 */
export function HabitGrid({
  habits,
  entriesByHabit,
  onCellChange,
  onEditHabit,
}: HabitGridProps) {
  const isWide = useMediaQuery('(min-width: 768px)');
  const visibleDays = isWide ? 7 : 4;
  const { ref: wrapRef, width } = useElementWidth<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = todayKey();

  // Day range: far enough back to backfill history. Extends to include the
  // earliest habit creation or recorded entry, always offering at least
  // MIN_HISTORY_DAYS of scrollable past, capped at MAX_DAYS.
  const days = useMemo<DayKey[]>(() => {
    let earliest = today;
    for (const habit of habits) {
      const key = habit.createdAt.slice(0, 10);
      if (key < earliest) earliest = key;
      for (const entry of entriesByHabit.get(habit.id) ?? []) {
        if (entry.date < earliest) earliest = entry.date;
      }
    }
    const historyDays = diffDays(earliest, today) + 1;
    const totalDays = Math.min(
      Math.max(historyDays, MIN_HISTORY_DAYS, visibleDays),
      MAX_DAYS,
    );
    const startKey = addDays(today, -(totalDays - 1));
    return rangeBetween(startKey, today);
  }, [habits, entriesByHabit, today, visibleDays]);

  // Size the name column and the day cells so exactly `visibleDays` fit.
  const nameColWidth = width
    ? Math.min(160, Math.max(96, Math.round(width * 0.34)))
    : 120;
  const cellSize = width
    ? Math.max(
        MIN_CELL,
        Math.min(
          MAX_CELL,
          Math.floor((width - nameColWidth - visibleDays * GAP) / visibleDays),
        ),
      )
    : MIN_CELL;

  // Keep today (right edge) in view whenever layout changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [cellSize, days.length, habits.length]);

  // Per-habit day -> status maps.
  const statusMaps = useMemo(() => {
    const maps = new Map<string, Map<DayKey, DayStatus>>();
    for (const habit of habits) {
      const map = new Map<DayKey, DayStatus>();
      for (const entry of entriesByHabit.get(habit.id) ?? []) {
        map.set(entry.date, entry.status);
      }
      maps.set(habit.id, map);
    }
    return maps;
  }, [habits, entriesByHabit]);

  return (
    <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div ref={scrollRef} className="overflow-x-auto scrollbar-none">
        {/* Header */}
        <div className="flex w-max items-end border-b border-slate-100 pb-1 pt-2" style={{ gap: GAP }}>
          <div
            className="sticky left-0 z-10 bg-white px-2 text-xs font-semibold uppercase tracking-wide text-slate-400"
            style={{ width: nameColWidth, minWidth: nameColWidth }}
          >
            Habit
          </div>
          {days.map((date) => {
            const todayCol = isTodayKey(date);
            return (
              <div
                key={date}
                className="flex flex-col items-center"
                style={{ width: cellSize }}
              >
                <span
                  className={`text-[10px] font-medium uppercase ${
                    todayCol ? 'text-green-600' : 'text-slate-400'
                  }`}
                >
                  {formatWeekday(date)}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    todayCol ? 'text-green-600' : 'text-slate-600'
                  }`}
                >
                  {formatDayOfMonth(date)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              days={days}
              statusByDate={statusMaps.get(habit.id) ?? new Map()}
              cellSize={cellSize}
              nameColWidth={nameColWidth}
              gap={GAP}
              today={today}
              onCellChange={(date, status) =>
                onCellChange(habit.id, date, status)
              }
              onEdit={onEditHabit}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
