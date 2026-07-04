import type { HabitAnalytics } from '../../types';
import { formatPercent } from '../../logic/analytics';

/**
 * Ranked list of habits (best-first) by recent completion. Highlights the top
 * performer and the one that needs the most attention.
 */
export function HabitRanking({ ranked }: { ranked: HabitAnalytics[] }) {
  if (ranked.length === 0) return null;

  const bestId = ranked[0].habit.id;
  const worstId = ranked[ranked.length - 1].habit.id;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">Ranking</h3>
      <ol className="space-y-2">
        {ranked.map((item, index) => {
          const tag =
            ranked.length > 1 && item.habit.id === bestId
              ? { label: 'Best', cls: 'bg-green-100 text-green-700' }
              : ranked.length > 1 && item.habit.id === worstId
                ? { label: 'Needs work', cls: 'bg-amber-100 text-amber-700' }
                : null;
          return (
            <li
              key={item.habit.id}
              className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
            >
              <span className="w-5 text-center text-sm font-bold text-slate-400">
                {index + 1}
              </span>
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.habit.color }}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                {item.habit.emoji && <span>{item.habit.emoji}</span>}
                <span className="truncate text-sm font-medium text-slate-800">
                  {item.habit.name}
                </span>
                {tag && (
                  <span
                    className={`ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tag.cls}`}
                  >
                    {tag.label}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold text-slate-800">
                  {formatPercent(item.completion.last30)}
                </span>
                <span className="block text-[10px] text-slate-400">30-day</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
