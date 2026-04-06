"use client";

import { CheckCircle2, Flame, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { YEAR_RANGE_DAYS } from "@/lib/constants";
import { formatDayLabel, getPreviousDateKey, toDateKey } from "@/lib/date";
import type { Habit, HabitEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardClientProps = {
  habits: Habit[];
  initialEntries: HabitEntry[];
  userEmail: string;
};

function getEntryKey(habitId: string, date: string) {
  return `${habitId}:${date}`;
}

function removeEntry(
  currentEntries: Record<string, HabitEntry>,
  key: string,
): Record<string, HabitEntry> {
  const nextEntries = { ...currentEntries };
  delete nextEntries[key];
  return nextEntries;
}

function getHeatmapLevel(completedCount: number, totalHabits: number): 0 | 1 | 2 | 3 | 4 {
  if (completedCount === 0 || totalHabits === 0) {
    return 0;
  }

  const percentage = (completedCount / totalHabits) * 100;

  if (percentage <= 25) return 1;
  if (percentage <= 50) return 2;
  if (percentage <= 75) return 3;
  return 4;
}

export function DashboardClient({
  habits,
  initialEntries,
  userEmail,
}: DashboardClientProps) {
  const today = toDateKey(new Date());
  const [entries, setEntries] = useState<Record<string, HabitEntry>>(() =>
    Object.fromEntries(
      initialEntries.map((entry) => [getEntryKey(entry.habit_id, entry.date), entry]),
    ),
  );
  const [savingHabitIds, setSavingHabitIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const completedCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};

    Object.values(entries).forEach((entry) => {
      if (!entry.completed) {
        return;
      }

      counts[entry.date] = (counts[entry.date] ?? 0) + 1;
    });

    return counts;
  }, [entries]);

  const globalLevelsByDate = useMemo(() => {
    const levels: Record<string, 0 | 1 | 2 | 3 | 4> = {};

    Object.entries(completedCountByDate).forEach(([date, completedCount]) => {
      levels[date] = getHeatmapLevel(completedCount, habits.length);
    });

    return levels;
  }, [completedCountByDate, habits.length]);

  const globalLabelsByDate = useMemo(() => {
    const labels: Record<string, string> = {};

    Object.keys(globalLevelsByDate).forEach((date) => {
      const completedCount = completedCountByDate[date] ?? 0;
      labels[date] = `${formatDayLabel(date)} · ${completedCount}/${habits.length} habits completed`;
    });

    return labels;
  }, [completedCountByDate, globalLevelsByDate, habits.length]);

  const completedToday = completedCountByDate[today] ?? 0;

  function getHabitCompleted(habitId: string, date = today) {
    return entries[getEntryKey(habitId, date)]?.completed ?? false;
  }

  function getHabitStreak(habitId: string) {
    let streak = 0;
    let cursor = today;

    while (entries[getEntryKey(habitId, cursor)]?.completed) {
      streak += 1;
      cursor = getPreviousDateKey(cursor);
    }

    return streak;
  }

  async function toggleHabit(habitId: string) {
    if (savingHabitIds.includes(habitId)) {
      return;
    }

    const currentKey = getEntryKey(habitId, today);
    const currentEntry = entries[currentKey];
    const nextCompleted = !currentEntry?.completed;

    setError(null);
    setSavingHabitIds((current) => [...current, habitId]);
    setEntries((current) => ({
      ...current,
      [currentKey]: {
        id: currentEntry?.id ?? `optimistic-${currentKey}`,
        user_id: currentEntry?.user_id ?? "pending",
        habit_id: habitId,
        date: today,
        completed: nextCompleted,
        created_at: currentEntry?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }));

    const response = await fetch("/api/habit-entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        habitId,
        date: today,
        completed: nextCompleted,
      }),
    });

    if (!response.ok) {
      setEntries((current) =>
        currentEntry
          ? {
              ...current,
              [currentKey]: currentEntry,
            }
          : removeEntry(current, currentKey),
      );
      setError("Unable to save that habit right now.");
      setSavingHabitIds((current) => current.filter((id) => id !== habitId));
      return;
    }

    const data = (await response.json()) as { entry: HabitEntry };

    setEntries((current) => ({
      ...current,
      [currentKey]: data.entry,
    }));
    setSavingHabitIds((current) => current.filter((id) => id !== habitId));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4 rounded-3xl border bg-[var(--card)] p-5 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted)]">{userEmail}</p>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Habit Tracker</h1>
            <p className="text-sm text-[var(--muted)] sm:text-base">
              A tiny daily dashboard for the last 12 months.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="rounded-2xl border bg-[var(--card-strong)] px-4 py-3 text-sm">
            <p className="text-[var(--muted)]">Today</p>
            <p className="font-semibold">
              {completedToday}/{habits.length} habits
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border bg-[var(--card)] p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Today</h2>
            <p className="text-sm text-[var(--muted)]">
              Tap once to mark a habit complete for {formatDayLabel(today)}.
            </p>
          </div>
          <div className="hidden rounded-full border bg-[var(--card-strong)] px-3 py-1.5 text-sm text-[var(--muted)] sm:inline-flex">
            Instant save
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {habits.map((habit) => {
            const completed = getHabitCompleted(habit.id);
            const isSaving = savingHabitIds.includes(habit.id);
            const streak = getHabitStreak(habit.id);

            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => toggleHabit(habit.id)}
                disabled={isSaving}
                className={cn(
                  "flex min-h-24 flex-col items-start justify-between rounded-2xl border px-4 py-4 text-left transition",
                  completed
                    ? "border-emerald-400/30 bg-emerald-500/10"
                    : "bg-[var(--card-strong)] hover:bg-white/80 dark:hover:bg-white/5",
                  isSaving && "cursor-wait opacity-80",
                )}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <span className="text-sm font-medium">{habit.name}</span>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />
                  ) : (
                    <CheckCircle2
                      className={cn(
                        "h-5 w-5",
                        completed ? "text-emerald-500" : "text-[var(--muted)]",
                      )}
                    />
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                  <Flame className="h-3.5 w-3.5" />
                  {streak} day streak
                </span>
              </button>
            );
          })}
        </div>

        {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}
      </section>

      <ContributionHeatmap
        title="All habits"
        subtitle="Color intensity reflects the percentage completed each day."
        levelsByDate={globalLevelsByDate}
        labelsByDate={globalLabelsByDate}
        todayDate={today}
        rangeDays={YEAR_RANGE_DAYS}
      />

      <section className="space-y-4">
        {habits.map((habit) => {
          const levelsByDate: Record<string, 0 | 1 | 2 | 3 | 4> = {};
          const labelsByDate: Record<string, string> = {};

          Object.values(entries).forEach((entry) => {
            if (entry.habit_id !== habit.id || !entry.completed) {
              return;
            }

            levelsByDate[entry.date] = 4;
            labelsByDate[entry.date] = `${formatDayLabel(entry.date)} · completed`;
          });

          labelsByDate[today] =
            labelsByDate[today] ?? `${formatDayLabel(today)} · not completed`;

          return (
            <ContributionHeatmap
              key={habit.id}
              title={habit.name}
              subtitle={`${getHabitStreak(habit.id)} day streak`}
              levelsByDate={levelsByDate}
              labelsByDate={labelsByDate}
              todayDate={today}
              onTodayClick={() => toggleHabit(habit.id)}
              rangeDays={YEAR_RANGE_DAYS}
            />
          );
        })}
      </section>
    </main>
  );
}
