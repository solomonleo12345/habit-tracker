import { describe, it, expect } from 'vitest';
import type { Entry, Habit, StoredStatus } from '../types';
import {
  allTimeCompletion,
  completionRate,
  completionStats,
  countByStatus,
  computeHabitAnalytics,
  dailyCompletion,
  formatPercent,
  rankByPerformance,
} from './analytics';

function e(date: string, status: StoredStatus): Entry {
  return { id: date, habitId: 'h', date, status, updatedAt: `${date}T00:00:00Z` };
}

function habit(id: string, createdAt: string, extra: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    color: '#22c55e',
    order: 0,
    createdAt,
    ...extra,
  };
}

const TODAY = '2024-06-15';

describe('completionRate', () => {
  it('is ticked days over the window size', () => {
    const entries = [
      e('2024-06-15', 'ticked'),
      e('2024-06-14', 'ticked'),
      e('2024-06-13', 'skipped'), // not a completion
    ];
    expect(completionRate(entries, 7, TODAY)).toBeCloseTo(2 / 7);
  });

  it('ignores ticks outside the window', () => {
    const entries = [
      e('2024-06-15', 'ticked'),
      e('2024-06-01', 'ticked'), // outside 7-day window
    ];
    expect(completionRate(entries, 7, TODAY)).toBeCloseTo(1 / 7);
  });

  it('returns 0 for a non-positive window', () => {
    expect(completionRate([e('2024-06-15', 'ticked')], 0, TODAY)).toBe(0);
  });
});

describe('allTimeCompletion', () => {
  it('divides ticks by days since first entry', () => {
    const entries = [
      e('2024-06-13', 'ticked'),
      e('2024-06-14', 'ticked'),
      e('2024-06-15', 'ticked'),
    ];
    // 3 ticks over 3 days = 1.0
    expect(allTimeCompletion(entries, TODAY)).toBeCloseTo(1);
  });

  it('accounts for missed days in the denominator', () => {
    const entries = [
      e('2024-06-13', 'ticked'),
      // 14 missed
      e('2024-06-15', 'ticked'),
    ];
    // 2 ticks over 3 days
    expect(allTimeCompletion(entries, TODAY)).toBeCloseTo(2 / 3);
  });

  it('is 0 with no entries', () => {
    expect(allTimeCompletion([], TODAY)).toBe(0);
  });
});

describe('completionStats', () => {
  it('computes all three windows', () => {
    const entries = [e('2024-06-15', 'ticked'), e('2024-06-14', 'ticked')];
    const stats = completionStats(entries, TODAY);
    expect(stats.last7).toBeCloseTo(2 / 7);
    expect(stats.last30).toBeCloseTo(2 / 30);
    expect(stats.allTime).toBeCloseTo(1);
  });
});

describe('countByStatus', () => {
  it('counts ticked and skipped', () => {
    const entries = [
      e('2024-06-15', 'ticked'),
      e('2024-06-14', 'ticked'),
      e('2024-06-13', 'skipped'),
    ];
    expect(countByStatus(entries)).toEqual({ ticked: 2, skipped: 1 });
  });
});

describe('computeHabitAnalytics', () => {
  it('bundles streak, completion and totals', () => {
    const h = habit('h', '2024-06-13T00:00:00Z');
    const entries = [
      e('2024-06-13', 'ticked'),
      e('2024-06-14', 'ticked'),
      e('2024-06-15', 'ticked'),
    ];
    const a = computeHabitAnalytics(h, entries, TODAY);
    expect(a.streak.current).toBe(3);
    expect(a.streak.longest).toBe(3);
    expect(a.totalTicked).toBe(3);
    expect(a.completion.allTime).toBeCloseTo(1);
  });
});

describe('rankByPerformance', () => {
  it('sorts by 30-day completion, then current streak', () => {
    const low = computeHabitAnalytics(
      habit('low', '2024-06-01T00:00:00Z'),
      [e('2024-06-15', 'ticked')],
      TODAY,
    );
    const high = computeHabitAnalytics(
      habit('high', '2024-06-01T00:00:00Z'),
      [
        e('2024-06-13', 'ticked'),
        e('2024-06-14', 'ticked'),
        e('2024-06-15', 'ticked'),
      ],
      TODAY,
    );
    const ranked = rankByPerformance([low, high]);
    expect(ranked[0].habit.id).toBe('high');
    expect(ranked[1].habit.id).toBe('low');
  });
});

describe('dailyCompletion', () => {
  it('counts a habit as active only on/after its creation day', () => {
    const h1 = habit('h1', '2024-06-14T00:00:00Z');
    const h2 = habit('h2', '2024-06-15T00:00:00Z'); // created later
    const data = dailyCompletion(
      [
        { habit: h1, entries: [e('2024-06-14', 'ticked'), e('2024-06-15', 'ticked')] },
        { habit: h2, entries: [e('2024-06-15', 'ticked')] },
      ],
      ['2024-06-14', '2024-06-15'],
    );
    // Day 14: only h1 active, ticked 1/1
    expect(data[0]).toMatchObject({ date: '2024-06-14', ticked: 1, active: 1 });
    expect(data[0].rate).toBeCloseTo(1);
    // Day 15: both active, ticked 2/2
    expect(data[1]).toMatchObject({ date: '2024-06-15', ticked: 2, active: 2 });
    expect(data[1].rate).toBeCloseTo(1);
  });

  it('excludes archived habits after their archive day', () => {
    const h = habit('h', '2024-06-13T00:00:00Z', {
      archivedAt: '2024-06-15T00:00:00Z',
    });
    const data = dailyCompletion(
      [{ habit: h, entries: [e('2024-06-14', 'ticked')] }],
      ['2024-06-14', '2024-06-15'],
    );
    expect(data[0].active).toBe(1); // still active on 14
    expect(data[1].active).toBe(0); // archived on 15
  });

  it('counts entries backfilled before the creation day as active', () => {
    const h = habit('h', '2024-06-15T00:00:00Z'); // created today
    const data = dailyCompletion(
      [{ habit: h, entries: [e('2024-06-13', 'ticked')] }], // backdated entry
      ['2024-06-13', '2024-06-14', '2024-06-15'],
    );
    expect(data[0]).toMatchObject({ date: '2024-06-13', ticked: 1, active: 1 });
    expect(data[0].rate).toBeCloseTo(1);
  });
});

describe('formatPercent', () => {
  it('rounds to a whole percent', () => {
    expect(formatPercent(0.833)).toBe('83%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0)).toBe('0%');
  });
});
