import type { DayStatus, Habit } from '../types';
import type { DayKey } from '../logic/dates';
import { isToday as isTodayKey } from '../logic/dates';
import { DayCell } from './DayCell';

interface HabitRowProps {
  habit: Habit;
  days: DayKey[];
  statusByDate: Map<DayKey, DayStatus>;
  cellSize: number;
  nameColWidth: number;
  gap: number;
  today: DayKey;
  onCellChange: (date: DayKey, status: DayStatus) => void;
  onEdit: (habit: Habit) => void;
}

/** One habit: a sticky name cell followed by its day cells. */
export function HabitRow({
  habit,
  days,
  statusByDate,
  cellSize,
  nameColWidth,
  gap,
  today,
  onCellChange,
  onEdit,
}: HabitRowProps) {
  return (
    <div className="flex w-max items-center" style={{ gap }}>
      <button
        type="button"
        onClick={() => onEdit(habit)}
        title="Edit habit"
        className="sticky left-0 z-10 flex h-full items-center gap-2 bg-white px-2 py-2 text-left"
        style={{ width: nameColWidth, minWidth: nameColWidth }}
      >
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: habit.color }}
          aria-hidden
        />
        {habit.emoji && <span className="text-base leading-none">{habit.emoji}</span>}
        <span className="truncate text-sm font-medium text-slate-800">
          {habit.name}
        </span>
      </button>

      {days.map((date) => {
        const status = statusByDate.get(date) ?? 'empty';
        // Any day up to today is editable (including backfilling the past);
        // only future days are locked.
        const future = date > today;
        return (
          <DayCell
            key={date}
            status={status}
            size={cellSize}
            color={habit.color}
            disabled={future}
            isToday={isTodayKey(date)}
            label={`${habit.name} on ${date}`}
            onChange={(next) => onCellChange(date, next)}
          />
        );
      })}
    </div>
  );
}
