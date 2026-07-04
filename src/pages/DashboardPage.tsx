import { useMemo } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useEntriesByHabit } from '../hooks/useEntries';
import {
  computeHabitAnalytics,
  dailyCompletion,
  formatPercent,
  rankByPerformance,
} from '../logic/analytics';
import { rangeEndingAt, todayKey } from '../logic/dates';
import { StatCard } from '../components/dashboard/StatCard';
import { CalendarHeatmap } from '../components/dashboard/CalendarHeatmap';
import { CompletionChart } from '../components/dashboard/CompletionChart';
import { HabitRanking } from '../components/dashboard/HabitRanking';
import { HabitAnalyticsCard } from '../components/dashboard/HabitAnalyticsCard';
import { ChartIcon, CheckIcon, FlameIcon, GridIcon } from '../components/icons';

export function DashboardPage() {
  const habits = useHabits();
  const entriesByHabit = useEntriesByHabit();
  const loading = habits === undefined || entriesByHabit === undefined;
  const today = todayKey();

  const model = useMemo(() => {
    if (!habits || !entriesByHabit) return null;

    const habitsWithEntries = habits.map((habit) => ({
      habit,
      entries: entriesByHabit.get(habit.id) ?? [],
    }));

    const analytics = habitsWithEntries.map(({ habit, entries }) =>
      computeHabitAnalytics(habit, entries, today),
    );
    const ranked = rankByPerformance(analytics);

    const bestStreak = analytics.reduce(
      (max, a) => Math.max(max, a.streak.current),
      0,
    );

    const daily30 = dailyCompletion(habitsWithEntries, rangeEndingAt(today, 30));
    const ticked30 = daily30.reduce((s, d) => s + d.ticked, 0);
    const active30 = daily30.reduce((s, d) => s + d.active, 0);
    const overall30 = active30 > 0 ? ticked30 / active30 : 0;

    const todayData = dailyCompletion(habitsWithEntries, [today])[0];

    return {
      habitsWithEntries,
      ranked,
      bestStreak,
      overall30,
      todayTicked: todayData.ticked,
      todayActive: todayData.active,
    };
  }, [habits, entriesByHabit, today]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!model || habits.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500">
          Add a few habits and start tracking to see your analytics here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Today"
          value={`${model.todayTicked}/${model.todayActive}`}
          sublabel="habits done"
          Icon={CheckIcon}
        />
        <StatCard
          label="30-day rate"
          value={formatPercent(model.overall30)}
          sublabel="completion"
          Icon={ChartIcon}
          accent="#3b82f6"
        />
        <StatCard
          label="Best streak"
          value={`${model.bestStreak}`}
          sublabel="days in a row"
          Icon={FlameIcon}
          accent="#f97316"
        />
        <StatCard
          label="Habits"
          value={`${habits.length}`}
          sublabel="being tracked"
          Icon={GridIcon}
          accent="#a855f7"
        />
      </div>

      <CalendarHeatmap habitsWithEntries={model.habitsWithEntries} />

      <CompletionChart habitsWithEntries={model.habitsWithEntries} />

      <HabitRanking ranked={model.ranked} />

      <section>
        <h2 className="mb-2 mt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Per habit
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {model.ranked.map((data) => (
            <HabitAnalyticsCard key={data.habit.id} data={data} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-40 rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-white" />
      <div className="h-56 rounded-2xl bg-white" />
    </div>
  );
}
