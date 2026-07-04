import type { DayStatus } from '../types';
import { CheckIcon } from './icons';

interface DayCellProps {
  status: DayStatus;
  /** Square size in px (width === height). */
  size: number;
  /** Habit accent color, used for the ticked fill. */
  color: string;
  /** Future days can't be edited. */
  disabled?: boolean;
  /** Highlights today's column. */
  isToday?: boolean;
  /** Accessible label, e.g. "Drink water on Jun 5". */
  label: string;
  /** Called with the next status after a tap. */
  onChange: (status: DayStatus) => void;
}

/** The next state in the tap cycle. */
function nextStatus(status: DayStatus): DayStatus {
  return status === 'empty' ? 'ticked' : status === 'ticked' ? 'skipped' : 'empty';
}

/**
 * A large, tappable habit cell whose three states cycle on each tap:
 * empty -> ticked (done) -> skipped (day off) -> empty -> ...
 *
 * The same cycle is available to keyboard users via Enter/Space.
 */
export function DayCell({
  status,
  size,
  color,
  disabled = false,
  isToday = false,
  label,
  onChange,
}: DayCellProps) {
  function cycle() {
    if (disabled) return;
    onChange(nextStatus(status));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    cycle();
  }

  const isTicked = status === 'ticked';
  const isSkipped = status === 'skipped';

  const base =
    'relative flex items-center justify-center rounded-xl border transition-colors no-select outline-none';
  const stateClasses = disabled
    ? 'border-transparent bg-transparent cursor-default'
    : isTicked
      ? 'border-transparent text-white shadow-sm'
      : isSkipped
        ? 'border-transparent bg-amber-400 text-white shadow-sm'
        : [
            'bg-slate-50 hover:bg-slate-100 active:bg-slate-200 cursor-pointer',
            isToday ? 'border-green-400 border-2' : 'border-slate-200',
          ].join(' ');

  const iconSize = Math.round(size * 0.5);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isTicked}
      aria-disabled={disabled}
      title={disabled ? undefined : statusHint(status)}
      onClick={cycle}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      className={`${base} ${stateClasses}`}
      style={{
        width: size,
        height: size,
        backgroundColor: isTicked && !disabled ? color : undefined,
      }}
    >
      {isTicked && <CheckIcon width={iconSize} height={iconSize} strokeWidth={3} />}
      {isSkipped && (
        // A dash communicates an intentional "day off".
        <span
          aria-hidden
          className="rounded-full bg-white"
          style={{ width: iconSize, height: Math.max(3, Math.round(size * 0.11)) }}
        />
      )}
    </button>
  );
}

function statusHint(status: DayStatus): string {
  switch (status) {
    case 'ticked':
      return 'Done · tap to skip';
    case 'skipped':
      return 'Skipped · tap to reset';
    default:
      return 'Tap to mark done';
  }
}
