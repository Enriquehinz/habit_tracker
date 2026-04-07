import { subDays } from "date-fns";

import { normalizeDateKey, toDateKey } from "@/lib/date";
import type { CompetitionSummary, Habit, HabitEntry } from "@/lib/types";

function getHabitCreatedDateKey(habit: Habit) {
  return normalizeDateKey(habit.created_at);
}

export function getActiveHabitCountForDate(habits: Habit[], dateKey: string) {
  return habits.filter((habit) => {
    const createdDateKey = getHabitCreatedDateKey(habit);
    return createdDateKey ? createdDateKey <= dateKey : false;
  }).length;
}

export function getCompletedCountByDate(entries: HabitEntry[]) {
  const counts: Record<string, number> = {};

  entries.forEach((entry) => {
    const dateKey = normalizeDateKey(entry.date);

    if (!entry.completed || !dateKey) {
      return;
    }

    counts[dateKey] = (counts[dateKey] ?? 0) + 1;
  });

  return counts;
}

export function getCompletionPercentageForDate(
  habits: Habit[],
  completedCountByDate: Record<string, number>,
  dateKey: string,
) {
  const totalHabits = getActiveHabitCountForDate(habits, dateKey);

  if (totalHabits === 0) {
    return 0;
  }

  const completedCount = completedCountByDate[dateKey] ?? 0;

  return Math.min(completedCount / totalHabits, 1);
}

export function getDailyCompletionSnapshot(
  habits: Habit[],
  completedCountByDate: Record<string, number>,
  dateKey: string,
) {
  const totalHabits = getActiveHabitCountForDate(habits, dateKey);
  const completedCount = completedCountByDate[dateKey] ?? 0;

  return {
    completedCount,
    percentage:
      totalHabits === 0 ? 0 : Math.min(completedCount / totalHabits, 1),
    totalHabits,
  };
}

export function getHeatmapLevelFromPercentage(percentage: number): 0 | 1 | 2 | 3 | 4 {
  if (percentage <= 0) return 0;
  if (percentage <= 0.25) return 1;
  if (percentage <= 0.5) return 2;
  if (percentage <= 0.75) return 3;
  return 4;
}

export function getAverageCompletionPercentage(
  habits: Habit[],
  entries: HabitEntry[],
  days = 7,
  today = new Date(),
) {
  if (days <= 0) {
    return 0;
  }

  const completedCountByDate = getCompletedCountByDate(entries);
  let totalPercentage = 0;

  for (let index = 0; index < days; index += 1) {
    const dateKey = toDateKey(subDays(today, index));
    totalPercentage += getCompletionPercentageForDate(habits, completedCountByDate, dateKey);
  }

  return totalPercentage / days;
}

export function getAverageCompletionPercentageForOffset(
  habits: Habit[],
  entries: HabitEntry[],
  days: number,
  offsetDays: number,
  today = new Date(),
) {
  if (days <= 0) {
    return 0;
  }

  const completedCountByDate = getCompletedCountByDate(entries);
  let totalPercentage = 0;

  for (let index = 0; index < days; index += 1) {
    const dateKey = toDateKey(subDays(today, index + offsetDays));
    totalPercentage += getCompletionPercentageForDate(habits, completedCountByDate, dateKey);
  }

  return totalPercentage / days;
}

export function getTrendFromScores(currentScore: number, previousScore: number) {
  const delta = currentScore - previousScore;

  if (delta > 0.03) {
    return "improving" as const;
  }

  if (delta < -0.03) {
    return "declining" as const;
  }

  return "stable" as const;
}

export function rankCompetitionSummaries(rows: CompetitionSummary[]) {
  const sortedRows = [...rows].sort((left, right) => {
    if (right.weeklyScore !== left.weeklyScore) {
      return right.weeklyScore - left.weeklyScore;
    }

    return left.email.localeCompare(right.email);
  });

  let lastScore: number | null = null;
  let lastRank = 0;

  return sortedRows.map((row, index) => {
    if (lastScore === null || Math.abs(lastScore - row.weeklyScore) > 0.0001) {
      lastRank = index + 1;
      lastScore = row.weeklyScore;
    }

    return {
      ...row,
      rank: lastRank,
    };
  });
}
