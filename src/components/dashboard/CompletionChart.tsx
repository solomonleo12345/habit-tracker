import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  format,
} from 'date-fns';
import type { Entry, Habit } from '../../types';
import { dailyCompletion } from '../../logic/analytics';
import {
  fromDayKey,
  rangeBetween,
  toDayKey,
  todayKey,
} from '../../logic/dates';

type Period = 'week' | 'month';

const WEEK_COUNT = 12;
const MONTH_COUNT = 6;

/** Weekly or monthly completion-rate bar chart across all habits. */
export function CompletionChart({
  habitsWithEntries,
}: {
  habitsWithEntries: { habit: Habit; entries: Entry[] }[];
}) {
  const [period, setPeriod] = useState<Period>('week');
  const today = todayKey();

  const data = useMemo(() => {
    const start =
      period === 'week'
        ? startOfWeek(subWeeks(fromDayKey(today), WEEK_COUNT - 1), {
            weekStartsOn: 1,
          })
        : startOfMonth(subMonths(fromDayKey(today), MONTH_COUNT - 1));

    const keys = rangeBetween(toDayKey(start), today);
    const daily = dailyCompletion(habitsWithEntries, keys);

    // Bucket days by week/month start.
    const buckets = new Map<
      string,
      { label: string; ticked: number; active: number; order: number }
    >();
    for (const day of daily) {
      const date = fromDayKey(day.date);
      const bucketStart =
        period === 'week'
          ? startOfWeek(date, { weekStartsOn: 1 })
          : startOfMonth(date);
      const key = toDayKey(bucketStart);
      const label =
        period === 'week' ? format(bucketStart, 'MMM d') : format(bucketStart, 'MMM');
      const existing = buckets.get(key) ?? {
        label,
        ticked: 0,
        active: 0,
        order: bucketStart.getTime(),
      };
      existing.ticked += day.ticked;
      existing.active += day.active;
      buckets.set(key, existing);
    }

    return [...buckets.values()]
      .sort((a, b) => a.order - b.order)
      .map((b) => ({
        label: b.label,
        rate: b.active > 0 ? Math.round((b.ticked / b.active) * 100) : 0,
      }));
  }, [habitsWithEntries, period, today]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Completion trend</h3>
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`rounded-md px-2.5 py-1 transition ${
              period === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`rounded-md px-2.5 py-1 transition ${
              period === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(v: number) => [`${v}%`, 'Completion']}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                fontSize: 12,
              }}
            />
            <Bar dataKey="rate" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
