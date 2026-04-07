"use client";

import { CheckCircle2, Flame, Loader2, Pencil, Plus, Trophy, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { YEAR_RANGE_DAYS } from "@/lib/constants";
import {
  formatDayLabel,
  getPreviousDateKey,
  normalizeDateKey,
  toDateKey,
} from "@/lib/date";
import {
  getActiveHabitCountForDate,
  getAverageCompletionPercentage,
  getAverageCompletionPercentageForOffset,
  getCompletedCountByDate,
  getCompletionPercentageForDate,
  getDailyCompletionSnapshot,
  getHeatmapLevelFromPercentage,
  getTrendFromScores,
  rankCompetitionSummaries,
} from "@/lib/scoring";
import type { CompetitionSummary, Habit, HabitEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardClientProps = {
  habits: Habit[];
  initialCompetition: CompetitionSummary[];
  initialEntries: HabitEntry[];
  userEmail: string;
  userId: string;
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

function removeEntriesForHabit(currentEntries: Record<string, HabitEntry>, habitId: string) {
  return Object.fromEntries(
    Object.entries(currentEntries).filter(([, entry]) => entry.habit_id !== habitId),
  );
}

function normalizeHabitEntry(entry: HabitEntry) {
  const dateKey = normalizeDateKey(entry.date);

  return dateKey ? { ...entry, date: dateKey } : null;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function DashboardClient({
  habits,
  initialCompetition,
  initialEntries,
  userEmail,
  userId,
}: DashboardClientProps) {
  const today = toDateKey(new Date());
  const todayLabel = formatDayLabel(today) ?? "today";
  const [habitList, setHabitList] = useState<Habit[]>(habits);
  const [entries, setEntries] = useState<Record<string, HabitEntry>>(() =>
    Object.fromEntries(
      initialEntries.flatMap((entry) => {
        const normalizedEntry = normalizeHabitEntry(entry);

        if (!normalizedEntry) {
          return [];
        }

        return [
          [getEntryKey(normalizedEntry.habit_id, normalizedEntry.date as string), normalizedEntry] as const,
        ];
      }),
    ),
  );
  const [savingHabitIds, setSavingHabitIds] = useState<string[]>([]);
  const [habitError, setHabitError] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitName, setEditingHabitName] = useState("");
  const [savingRenameHabitId, setSavingRenameHabitId] = useState<string | null>(null);
  const [confirmingDeleteHabitId, setConfirmingDeleteHabitId] = useState<string | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  const entryList = useMemo(() => Object.values(entries), [entries]);
  const completedCountByDate = useMemo(() => getCompletedCountByDate(entryList), [entryList]);

  const globalLevelsByDate = useMemo(() => {
    const levels: Record<string, 0 | 1 | 2 | 3 | 4> = {};

    Object.keys(completedCountByDate).forEach((date) => {
      const percentage = getCompletionPercentageForDate(habitList, completedCountByDate, date);
      levels[date] = getHeatmapLevelFromPercentage(percentage);
    });

    return levels;
  }, [completedCountByDate, habitList]);

  const globalLabelsByDate = useMemo(() => {
    const labels: Record<string, string> = {};

    Object.keys(completedCountByDate).forEach((date) => {
      const dayLabel = formatDayLabel(date);

      if (!dayLabel) {
        return;
      }

      const completedCount = completedCountByDate[date] ?? 0;
      const totalHabits = getActiveHabitCountForDate(habitList, date);
      const percentage = getCompletionPercentageForDate(habitList, completedCountByDate, date);

      labels[date] = `${dayLabel} · ${formatPercent(percentage)} (${completedCount}/${totalHabits})`;
    });

    return labels;
  }, [completedCountByDate, habitList]);

  const completedToday = completedCountByDate[today] ?? 0;
  const totalHabitsToday = getActiveHabitCountForDate(habitList, today);
  const currentUserScore = useMemo(
    () => getAverageCompletionPercentage(habitList, entryList, 7),
    [entryList, habitList],
  );
  const currentUserPreviousWeekScore = useMemo(
    () => getAverageCompletionPercentageForOffset(habitList, entryList, 7, 7),
    [entryList, habitList],
  );
  const currentUserTodaySnapshot = useMemo(
    () => getDailyCompletionSnapshot(habitList, completedCountByDate, today),
    [completedCountByDate, habitList, today],
  );

  const competitionRows = useMemo(() => {
    const rows = initialCompetition.some((row) => row.userId === userId)
      ? initialCompetition.map((row) =>
          row.userId === userId
            ? {
                ...row,
                email: userEmail,
                todayCompletedCount: currentUserTodaySnapshot.completedCount,
                todayHabitCount: currentUserTodaySnapshot.totalHabits,
                todayScore: currentUserTodaySnapshot.percentage,
                trend: getTrendFromScores(currentUserScore, currentUserPreviousWeekScore),
                weeklyScore: currentUserScore,
              }
            : row,
        )
      : [
          ...initialCompetition,
          {
            email: userEmail,
            todayCompletedCount: currentUserTodaySnapshot.completedCount,
            todayHabitCount: currentUserTodaySnapshot.totalHabits,
            todayScore: currentUserTodaySnapshot.percentage,
            trend: getTrendFromScores(currentUserScore, currentUserPreviousWeekScore),
            userId,
            weeklyScore: currentUserScore,
          },
        ];

    return rankCompetitionSummaries(rows);
  }, [
    currentUserPreviousWeekScore,
    currentUserScore,
    currentUserTodaySnapshot.completedCount,
    currentUserTodaySnapshot.percentage,
    currentUserTodaySnapshot.totalHabits,
    initialCompetition,
    userEmail,
    userId,
  ]);

  const leaderRows = competitionRows.filter(
    (row) => Math.abs(row.weeklyScore - (competitionRows[0]?.weeklyScore ?? 0)) < 0.0001,
  );

  function getTrendLabel(trend: CompetitionSummary["trend"]) {
    if (trend === "improving") {
      return "Improving";
    }

    if (trend === "declining") {
      return "Declining";
    }

    return "Stable";
  }

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

    setHabitError(null);
    setSavingHabitIds((current) => [...current, habitId]);
    setEntries((current) => ({
      ...current,
      [currentKey]: {
        id: currentEntry?.id ?? `optimistic-${currentKey}`,
        user_id: currentEntry?.user_id ?? userId,
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
      setHabitError("Unable to save that habit right now.");
      setSavingHabitIds((current) => current.filter((id) => id !== habitId));
      return;
    }

    const data = (await response.json()) as { entry: HabitEntry };
    const normalizedEntry = normalizeHabitEntry(data.entry);

    if (normalizedEntry) {
      setEntries((current) => ({
        ...current,
        [currentKey]: normalizedEntry,
      }));
    }

    setSavingHabitIds((current) => current.filter((id) => id !== habitId));
  }

  async function addHabit() {
    const trimmedName = newHabitName.trim();

    if (isAddingHabit) {
      return;
    }

    if (!trimmedName) {
      setHabitError("Habit name cannot be empty.");
      return;
    }

    setHabitError(null);
    setIsAddingHabit(true);

    const response = await fetch("/api/habits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: trimmedName }),
    });

    const data = (await response.json()) as { error?: string; habit?: Habit };

    if (!response.ok || !data.habit) {
      setHabitError(data.error ?? "Unable to add that habit.");
      setIsAddingHabit(false);
      return;
    }

    setHabitList((current) => [...current, data.habit!]);
    setNewHabitName("");
    setIsAddingHabit(false);
  }

  async function saveHabitRename(habitId: string) {
    const trimmedName = editingHabitName.trim();

    if (savingRenameHabitId) {
      return;
    }

    if (!trimmedName) {
      setHabitError("Habit name cannot be empty.");
      return;
    }

    setHabitError(null);
    setSavingRenameHabitId(habitId);

    const response = await fetch(`/api/habits/${habitId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: trimmedName }),
    });

    const data = (await response.json()) as { error?: string; habit?: Habit };

    if (!response.ok || !data.habit) {
      setHabitError(data.error ?? "Unable to rename that habit.");
      setSavingRenameHabitId(null);
      return;
    }

    setHabitList((current) =>
      current.map((habit) => (habit.id === habitId ? data.habit! : habit)),
    );
    setEditingHabitId(null);
    setEditingHabitName("");
    setSavingRenameHabitId(null);
  }

  async function deleteHabit(habitId: string) {
    if (deletingHabitId) {
      return;
    }

    setHabitError(null);
    setDeletingHabitId(habitId);

    const response = await fetch(`/api/habits/${habitId}`, {
      method: "DELETE",
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setHabitError(data.error ?? "Unable to delete that habit.");
      setDeletingHabitId(null);
      return;
    }

    setHabitList((current) => current.filter((habit) => habit.id !== habitId));
    setEntries((current) => removeEntriesForHabit(current, habitId));
    setConfirmingDeleteHabitId(null);
    setEditingHabitId((current) => (current === habitId ? null : current));
    setDeletingHabitId(null);
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
              {completedToday}/{totalHabitsToday} habits
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border bg-[var(--card)] p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
              <Trophy className="h-4 w-4" />
              Competition
            </div>
            <h2 className="text-lg font-semibold">
              {leaderRows.length > 1 ? "This week is tied" : "This week’s leader"}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {leaderRows.map((row) => row.email).join(" and ")} at{" "}
              {formatPercent(leaderRows[0]?.weeklyScore ?? 0)} average completion over the last 7
              days.
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--muted)]">Weekly leaderboard</h3>
          {competitionRows.map((row) => {
            const isLeader = row.rank === 1;
            const isCurrentUser = row.userId === userId;

            return (
              <div
                key={row.userId}
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  isLeader ? "border-amber-400/30 bg-amber-500/10" : "bg-[var(--card-strong)]",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      #{row.rank} {isCurrentUser ? `${row.email} (You)` : row.email}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Last 7 days · {getTrendLabel(row.trend)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatPercent(row.weeklyScore)}</p>
                </div>
                <div className="h-2 rounded-full bg-black/5 dark:bg-white/8">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      isLeader ? "bg-amber-500" : "bg-emerald-500",
                    )}
                    style={{ width: `${row.weeklyScore * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--muted)]">Today</h3>
          {competitionRows.map((row) => {
            const isCurrentUser = row.userId === userId;

            return (
              <div
                key={`${row.userId}-today`}
                className="rounded-2xl border bg-[var(--card-strong)] px-4 py-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {isCurrentUser ? `${row.email} (You)` : row.email}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {row.todayCompletedCount}/{row.todayHabitCount} habits today
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatPercent(row.todayScore)}</p>
                </div>
                <div className="h-2 rounded-full bg-black/5 dark:bg-white/8">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${row.todayScore * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border bg-[var(--card)] p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Today</h2>
            <p className="text-sm text-[var(--muted)]">
              Tap once to mark a habit complete for {todayLabel}.
            </p>
          </div>
          <div className="hidden rounded-full border bg-[var(--card-strong)] px-3 py-1.5 text-sm text-[var(--muted)] sm:inline-flex">
            Instant save
          </div>
        </div>

        {habitList.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {habitList.map((habit) => {
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
        ) : (
          <div className="rounded-2xl border bg-[var(--card-strong)] px-4 py-5 text-sm text-[var(--muted)]">
            You have no habits right now. Add one below to get started again.
          </div>
        )}

        {habitError ? <p className="mt-4 text-sm text-rose-500">{habitError}</p> : null}
      </section>

      <section className="rounded-3xl border bg-[var(--card)] p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Manage habits</h2>
          <p className="text-sm text-[var(--muted)]">
            Add, rename, or delete your personal habits without losing simplicity.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newHabitName}
            onChange={(event) => setNewHabitName(event.target.value)}
            placeholder="Add a new habit"
            className="h-12 flex-1 rounded-2xl border bg-[var(--card-strong)] px-4 outline-none"
          />
          <button
            type="button"
            onClick={addHabit}
            disabled={isAddingHabit}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAddingHabit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add habit
          </button>
        </div>

        <div className="space-y-3">
          {habitList.map((habit) => {
            const isEditing = editingHabitId === habit.id;
            const isDeleting = confirmingDeleteHabitId === habit.id;

            return (
              <div
                key={habit.id}
                className="rounded-2xl border bg-[var(--card-strong)] px-4 py-3"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={editingHabitName}
                      onChange={(event) => setEditingHabitName(event.target.value)}
                      className="h-11 flex-1 rounded-2xl border bg-transparent px-4 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveHabitRename(habit.id)}
                        disabled={savingRenameHabitId === habit.id}
                        className="rounded-2xl bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--background)] disabled:opacity-70"
                      >
                        {savingRenameHabitId === habit.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHabitId(null);
                          setEditingHabitName("");
                        }}
                        className="rounded-2xl border px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : isDeleting ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm">
                      Delete <span className="font-medium">{habit.name}</span> and all its history?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => deleteHabit(habit.id)}
                        disabled={deletingHabitId === habit.id}
                        className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                      >
                        {deletingHabitId === habit.id ? "Deleting..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteHabitId(null)}
                        className="rounded-2xl border px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{habit.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {getHabitStreak(habit.id)} day streak
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHabitId(habit.id);
                          setEditingHabitName(habit.name);
                          setConfirmingDeleteHabitId(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingDeleteHabitId(habit.id);
                          setEditingHabitId(null);
                          setEditingHabitName("");
                        }}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <ContributionHeatmap
        title="All habits"
        subtitle="Color intensity reflects your completion percentage for each day."
        levelsByDate={globalLevelsByDate}
        labelsByDate={globalLabelsByDate}
        todayDate={today}
        rangeDays={YEAR_RANGE_DAYS}
      />

      {habitList.length ? (
        <section className="space-y-4">
          {habitList.map((habit) => {
            const levelsByDate: Record<string, 0 | 1 | 2 | 3 | 4> = {};
            const labelsByDate: Record<string, string> = {};

            entryList.forEach((entry) => {
              if (entry.habit_id !== habit.id || !entry.completed) {
                return;
              }

              const dateKey = normalizeDateKey(entry.date);
              const dayLabel = formatDayLabel(entry.date);

              if (!dateKey || !dayLabel) {
                return;
              }

              levelsByDate[dateKey] = 4;
              labelsByDate[dateKey] = `${dayLabel} · completed`;
            });

            labelsByDate[today] =
              labelsByDate[today] ??
              (todayLabel ? `${todayLabel} · not completed` : "Today · not completed");

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
      ) : (
        <section className="rounded-3xl border bg-[var(--card)] p-5 text-sm text-[var(--muted)] shadow-sm backdrop-blur">
          No individual heatmaps to show yet because you currently have no habits.
        </section>
      )}
    </main>
  );
}
