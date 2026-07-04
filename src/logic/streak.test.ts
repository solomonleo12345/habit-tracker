import { describe, it, expect } from 'vitest';
import type { Entry, StoredStatus } from '../types';
import { currentStreak, longestStreak, computeStreaks } from './streak';

/** Build an Entry for a given day/status. */
function e(date: string, status: StoredStatus): Entry {
  return { id: date, habitId: 'h', date, status, updatedAt: `${date}T00:00:00Z` };
}

const TODAY = '2024-06-15';

describe('currentStreak', () => {
  it('returns 0 with no entries', () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it('counts consecutive ticked days ending today', () => {
    const entries = [
      e('2024-06-13', 'ticked'),
      e('2024-06-14', 'ticked'),
      e('2024-06-15', 'ticked'),
    ];
    expect(currentStreak(entries, TODAY)).toBe(3);
  });

  it('treats an empty today as pending (does not break)', () => {
    const entries = [
      e('2024-06-13', 'ticked'),
      e('2024-06-14', 'ticked'),
      // today (15th) is empty -> pending
    ];
    expect(currentStreak(entries, TODAY)).toBe(2);
  });

  it('a single skip preserves the streak but does not add to it', () => {
    const entries = [
      e('2024-06-13', 'ticked'),
      e('2024-06-14', 'skipped'),
      e('2024-06-15', 'ticked'),
    ];
    expect(currentStreak(entries, TODAY)).toBe(2);
  });

  it('two consecutive skips break the streak', () => {
    const entries = [
      e('2024-06-12', 'ticked'),
      e('2024-06-13', 'skipped'),
      e('2024-06-14', 'skipped'),
      e('2024-06-15', 'ticked'),
    ];
    // Walk back: 15 ticked(1), 14 skip(c1), 13 skip(c2 -> break)
    expect(currentStreak(entries, TODAY)).toBe(1);
  });

  it('an empty (missed) past day breaks the streak', () => {
    const entries = [
      e('2024-06-13', 'ticked'),
      // 14th empty (missed)
      e('2024-06-15', 'ticked'),
    ];
    expect(currentStreak(entries, TODAY)).toBe(1);
  });

  it('empty today with a trailing skip yesterday still counts prior ticks', () => {
    const entries = [
      e('2024-06-13', 'ticked'),
      e('2024-06-14', 'skipped'),
      // today empty -> start at yesterday (skip), then 13 ticked
    ];
    expect(currentStreak(entries, TODAY)).toBe(1);
  });

  it('two empty days in a row means stopped (streak 0)', () => {
    const entries = [
      e('2024-06-12', 'ticked'),
      // 13, 14 empty; today empty
    ];
    // today empty -> start 14 empty -> break
    expect(currentStreak(entries, TODAY)).toBe(0);
  });

  it('handles a skip as the most recent (today) action', () => {
    const entries = [
      e('2024-06-13', 'ticked'),
      e('2024-06-14', 'ticked'),
      e('2024-06-15', 'skipped'),
    ];
    // 15 skip(c1), 14 ticked(1), 13 ticked(2)
    expect(currentStreak(entries, TODAY)).toBe(2);
  });
});

describe('longestStreak', () => {
  it('returns 0 with no entries', () => {
    expect(longestStreak([], TODAY)).toBe(0);
  });

  it('finds the longest consecutive run of ticks', () => {
    const entries = [
      e('2024-06-01', 'ticked'),
      e('2024-06-02', 'ticked'),
      e('2024-06-03', 'ticked'),
      // gap (empty) on 4th
      e('2024-06-05', 'ticked'),
    ];
    expect(longestStreak(entries, TODAY)).toBe(3);
  });

  it('connects runs through a single skip', () => {
    const entries = [
      e('2024-06-01', 'ticked'),
      e('2024-06-02', 'ticked'),
      e('2024-06-03', 'skipped'),
      e('2024-06-04', 'ticked'),
      e('2024-06-05', 'ticked'),
      e('2024-06-06', 'ticked'),
    ];
    expect(longestStreak(entries, TODAY)).toBe(5);
  });

  it('breaks a run on two consecutive skips', () => {
    const entries = [
      e('2024-06-01', 'ticked'),
      e('2024-06-02', 'skipped'),
      e('2024-06-03', 'skipped'),
      e('2024-06-04', 'ticked'),
    ];
    expect(longestStreak(entries, TODAY)).toBe(1);
  });

  it('breaks a run on an empty day', () => {
    const entries = [
      e('2024-06-01', 'ticked'),
      // 2nd empty
      e('2024-06-03', 'ticked'),
    ];
    expect(longestStreak(entries, TODAY)).toBe(1);
  });
});

describe('computeStreaks', () => {
  it('returns both current and longest', () => {
    const entries = [
      e('2024-06-10', 'ticked'),
      e('2024-06-11', 'ticked'),
      e('2024-06-12', 'ticked'),
      // gap on 13
      e('2024-06-14', 'ticked'),
      e('2024-06-15', 'ticked'),
    ];
    expect(computeStreaks(entries, TODAY)).toEqual({ current: 2, longest: 3 });
  });
});
