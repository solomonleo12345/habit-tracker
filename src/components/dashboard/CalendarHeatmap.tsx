import { useMemo } from 'react';
import { startOfWeek, format } from 'date-fns';
import type { Entry, Habit } from '../../types';
import { dailyCompletion, formatPercent } from '../../logic/analytics';
import {
  fromDayKey,
  rangeBetween,
  toDayKey,
  todayKey,
  type DayKey,
} from '../../logic/dates';

const WEEKS = 18;
const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

function levelClass(rate: number, active: number): string {
  if (active === 0) return 'bg-slate-50';
  if (rate <= 0) return 'bg-slate-100';
  if (rate <= 0.25) return 'bg-green-200';
  if (rate <= 0.5) return 'bg-green-300';
  if (rate <= 0.75) return 'bg-green-400';
  if (rate < 1) return 'bg-green-500';
  return 'bg-green-600';
}

/**
 * GitHub-style contribution heatmap of overall daily completion across all
 * habits over the last ~18 weeks.
 */
export function CalendarHeatmap({
  habitsWithEntries,
}: {
  habitsWithEntries: { habit: Habit; entries: Entry[] }[];
}) {
  const today = todayKey();

  const { columns, monthLabels } = useMemo(() => {
    // Start on the Monday of the week (WEEKS-1) weeks ago.
    const startMonday = startOfWeek(
      fromDayKey(today),
      { weekStartsOn: 1 },
    );
    startMonday.setDate(startMonday.getDate() - (WEEKS - 1) * 7);
    const startKey = toDayKey(startMonday);

    const keys = rangeBetween(startKey, today);
    const data = dailyCompletion(habitsWithEntries, keys);
    const byDate = new Map(data.map((d) => [d.date, d]));

    // Arrange into columns of 7 (Mon..Sun).
    const cols: { date: DayKey; rate: number; active: number; ticked: number }[][] =
      [];
    for (let w = 0; w < WEEKS; w++) {
      const col: {
        date: DayKey;
        rate: number;
        active: number;
        ticked: number;
      }[] = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startMonday);
        cellDate.setDate(startMonday.getDate() + w * 7 + d);
        const key = toDayKey(cellDate);
        const entry = byDate.get(key);
        col.push({
          date: key,
          rate: entry?.rate ?? 0,
          active: entry?.active ?? 0,
          ticked: entry?.ticked ?? 0,
        });
      }
      cols.push(col);
    }

    // Month label above the first column whose first day starts a new month.
    const labels: { index: number; label: string }[] = [];
    let lastMonth = '';
    cols.forEach((col, i) => {
      const month = format(fromDayKey(col[0].date), 'MMM');
      if (month !== lastMonth) {
        labels.push({ index: i, label: month });
        lastMonth = month;
      }
    });

    return { columns: cols, monthLabels: labels };
  }, [habitsWithEntries, today]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">Activity</h3>
      <div className="overflow-x-auto scrollbar-none">
        <div className="inline-block">
          {/* Month labels */}
          <div className="mb-1 flex pl-8 text-[10px] text-slate-400">
            {columns.map((_, i) => {
              const label = monthLabels.find((m) => m.index === i)?.label ?? '';
              return (
                <div key={i} className="w-[15px] shrink-0">
                  {label}
                </div>
              );
            })}
          </div>

          <div className="flex">
            {/* Weekday labels */}
            <div className="mr-1 flex w-7 flex-col justify-between text-[10px] text-slate-400">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="h-[13px] leading-[13px]">
                  {label}
                </div>
              ))}
            </div>

            {/* Columns */}
            <div className="flex gap-[3px]">
              {columns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {col.map((cell) => {
                    const future = cell.date > today;
                    if (future) {
                      return <div key={cell.date} className="h-[13px] w-[12px]" />;
                    }
                    return (
                      <div
                        key={cell.date}
                        title={`${cell.date}: ${cell.ticked}/${cell.active} done (${formatPercent(cell.rate)})`}
                        className={`h-[13px] w-[12px] rounded-[3px] ${levelClass(cell.rate, cell.active)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-slate-400">
            <span>Less</span>
            <span className="h-[11px] w-[11px] rounded-[3px] bg-slate-100" />
            <span className="h-[11px] w-[11px] rounded-[3px] bg-green-200" />
            <span className="h-[11px] w-[11px] rounded-[3px] bg-green-300" />
            <span className="h-[11px] w-[11px] rounded-[3px] bg-green-400" />
            <span className="h-[11px] w-[11px] rounded-[3px] bg-green-600" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
