import { DEFAULT_HABITS } from "@/lib/constants";
import { getSql } from "@/lib/db";
import { normalizeDateKey } from "@/lib/date";
import {
  getAverageCompletionPercentage,
  getAverageCompletionPercentageForOffset,
  getCompletedCountByDate,
  getDailyCompletionSnapshot,
  getTrendFromScores,
} from "@/lib/scoring";
import type { AuthUser, CompetitionSummary, Habit, HabitEntry, UserProfile } from "@/lib/types";

function normalizeHabitEntry(entry: HabitEntry): HabitEntry {
  return {
    ...entry,
    date: normalizeDateKey(entry.date) ?? "",
  };
}

function normalizeHabitName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

async function findHabitNameConflict(userId: string, name: string, excludeHabitId?: string) {
  const sql = getSql();

  const rows = excludeHabitId
    ? ((await sql`
        select id
        from habits
        where user_id = ${userId}
          and lower(name) = lower(${name})
          and id <> ${excludeHabitId}
        limit 1
      `) as Pick<Habit, "id">[])
    : ((await sql`
        select id
        from habits
        where user_id = ${userId}
          and lower(name) = lower(${name})
        limit 1
      `) as Pick<Habit, "id">[]);

  return rows[0] ?? null;
}

export async function ensureUserProfile(user: AuthUser) {
  const sql = getSql();
  const rows = (await sql`
    insert into users (id, email)
    values (${user.id}, ${user.email})
    on conflict (id)
    do update set email = excluded.email
    returning id, email, default_habits_seeded, created_at
  `) as UserProfile[];

  return rows[0];
}

export async function ensureDefaultHabits(userId: string) {
  const sql = getSql();
  const users = (await sql`
    select id, default_habits_seeded
    from users
    where id = ${userId}
    limit 1
  `) as Pick<UserProfile, "default_habits_seeded" | "id">[];

  const user = users[0];

  if (!user || user.default_habits_seeded) {
    return;
  }

  const habitCounts = (await sql`
    select count(*)::int as count
    from habits
    where user_id = ${userId}
  `) as Array<{ count: number }>;

  if ((habitCounts[0]?.count ?? 0) > 0) {
    await sql`
      update users
      set default_habits_seeded = true
      where id = ${userId}
    `;
    return;
  }

  for (const habitName of DEFAULT_HABITS) {
    await sql`
      insert into habits (user_id, name)
      values (${userId}, ${habitName})
      on conflict (user_id, name) do nothing
    `;
  }

  await sql`
    update users
    set default_habits_seeded = true
    where id = ${userId}
  `;
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

export async function createHabitForUser(userId: string, name: string) {
  const normalizedName = normalizeHabitName(name);

  if (!normalizedName) {
    return { error: "Habit name cannot be empty." as const };
  }

  const existingHabit = await findHabitNameConflict(userId, normalizedName);

  if (existingHabit) {
    return { error: "You already have a habit with that name." as const };
  }

  const sql = getSql();
  const rows = (await sql`
    insert into habits (user_id, name)
    values (${userId}, ${normalizedName})
    returning id, user_id, name, created_at
  `) as Habit[];

  return { habit: rows[0] ?? null };
}

export async function renameHabitForUser(userId: string, habitId: string, name: string) {
  const normalizedName = normalizeHabitName(name);

  if (!normalizedName) {
    return { error: "Habit name cannot be empty." as const };
  }

  const habit = await getHabitForUser(userId, habitId);

  if (!habit) {
    return { error: "Habit not found." as const };
  }

  const existingHabit = await findHabitNameConflict(userId, normalizedName, habitId);

  if (existingHabit) {
    return { error: "You already have a habit with that name." as const };
  }

  const sql = getSql();
  const rows = (await sql`
    update habits
    set name = ${normalizedName}
    where id = ${habitId}
      and user_id = ${userId}
    returning id, user_id, name, created_at
  `) as Habit[];

  return { habit: rows[0] ?? null };
}

export async function deleteHabitForUser(userId: string, habitId: string) {
  const habit = await getHabitForUser(userId, habitId);

  if (!habit) {
    return false;
  }

  const sql = getSql();
  await sql`
    delete from habits
    where id = ${habitId}
      and user_id = ${userId}
  `;

  return true;
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

export async function getCompetitionSummaries() {
  const sql = getSql();
  const users = (await sql`
    select id, email, default_habits_seeded, created_at
    from users
    order by email asc
  `) as UserProfile[];

  const habits = (await sql`
    select id, user_id, name, created_at
    from habits
  `) as Habit[];

  const entries = (await sql`
    select id, user_id, habit_id, date, completed, created_at, updated_at
    from habit_entries
    where date >= current_date - interval '13 days'
  `) as HabitEntry[];

  return users.map<CompetitionSummary>((user) => {
    const userHabits = habits.filter((habit) => habit.user_id === user.id);
    const userEntries = entries
      .filter((entry) => entry.user_id === user.id)
      .map(normalizeHabitEntry)
      .filter((entry) => Boolean(entry.date));
    const completedCountByDate = getCompletedCountByDate(userEntries);
    const weeklyScore = getAverageCompletionPercentage(userHabits, userEntries, 7);
    const previousWeekScore = getAverageCompletionPercentageForOffset(
      userHabits,
      userEntries,
      7,
      7,
    );
    const todaySnapshot = getDailyCompletionSnapshot(
      userHabits,
      completedCountByDate,
      normalizeDateKey(new Date()) ?? "",
    );

    return {
      email: user.email,
      todayCompletedCount: todaySnapshot.completedCount,
      todayHabitCount: todaySnapshot.totalHabits,
      todayScore: todaySnapshot.percentage,
      trend: getTrendFromScores(weeklyScore, previousWeekScore),
      userId: user.id,
      weeklyScore,
    };
  });
}
