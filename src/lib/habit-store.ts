import { DEFAULT_HABITS } from "@/lib/constants";
import { getSql } from "@/lib/db";
import { normalizeDateKey } from "@/lib/date";
import type { Habit, HabitEntry } from "@/lib/types";

function normalizeHabitEntry(entry: HabitEntry): HabitEntry {
  return {
    ...entry,
    date: normalizeDateKey(entry.date) ?? "",
  };
}

export async function ensureDefaultHabits(userId: string) {
  const sql = getSql();

  for (const habitName of DEFAULT_HABITS) {
    await sql`
      insert into habits (user_id, name)
      values (${userId}, ${habitName})
      on conflict (user_id, name) do nothing
    `;
  }
}

export async function getHabitsForUser(userId: string) {
  const sql = getSql();

  return (await sql`
    select id, user_id, name, created_at
    from habits
    where user_id = ${userId}
    order by created_at asc
  `) as Habit[];
}

export async function getHabitEntriesForUser(userId: string, startDate: string) {
  const sql = getSql();

  const entries = (await sql`
    select id, user_id, habit_id, date, completed, created_at, updated_at
    from habit_entries
    where user_id = ${userId}
      and date >= ${startDate}
    order by date asc
  `) as HabitEntry[];

  return entries
    .map(normalizeHabitEntry)
    .filter((entry) => Boolean(entry.date));
}

export async function getHabitForUser(userId: string, habitId: string) {
  const sql = getSql();
  const rows = (await sql`
    select id
    from habits
    where id = ${habitId}
      and user_id = ${userId}
    limit 1
  `) as Pick<Habit, "id">[];

  return rows[0] ?? null;
}

export async function upsertHabitEntry({
  completed,
  date,
  habitId,
  userId,
}: {
  completed: boolean;
  date: string;
  habitId: string;
  userId: string;
}) {
  const sql = getSql();
  const rows = (await sql`
    insert into habit_entries (user_id, habit_id, date, completed)
    values (${userId}, ${habitId}, ${date}, ${completed})
    on conflict (user_id, habit_id, date)
    do update set
      completed = excluded.completed,
      updated_at = now()
    returning id, user_id, habit_id, date, completed, created_at, updated_at
  `) as HabitEntry[];

  return rows[0] ? normalizeHabitEntry(rows[0]) : null;
}
