import type { HabitAnalytics } from '../../types';
import { formatPercent } from '../../logic/analytics';
import { FlameIcon } from '../icons';

/** Per-habit detail: streaks and completion rates with small progress bars. */
export function HabitAnalyticsCard({ data }: { data: HabitAnalytics }) {
  const { habit, streak, completion } = data;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: habit.color }}
          aria-hidden
        />
        {habit.emoji && <span>{habit.emoji}</span>}
        <h3 className="truncate font-semibold text-slate-800">{habit.name}</h3>
      </div>

      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FlameIcon width={18} height={18} className="text-orange-500" />
          <span className="text-lg font-bold text-slate-900">
            {streak.current}
          </span>
          <span className="text-xs text-slate-400">current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-slate-900">
            {streak.longest}
          </span>
          <span className="text-xs text-slate-400">best</span>
        </div>
      </div>

      <div className="space-y-2">
        <Bar label="7 days" value={completion.last7} color={habit.color} />
        <Bar label="30 days" value={completion.last30} color={habit.color} />
        <Bar label="All time" value={completion.allTime} color={habit.color} />
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-slate-500">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.round(value * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-medium text-slate-600">
        {formatPercent(value)}
      </span>
    </div>
  );
}
