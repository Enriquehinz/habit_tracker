export type Habit = {
  created_at: string;
  id: string;
  name: string;
  user_id: string;
};

export type HabitEntry = {
  completed: boolean;
  created_at: string;
  date: string | Date;
  habit_id: string;
  id: string;
  updated_at: string;
  user_id: string;
};

export type AuthUser = {
  email: string;
  id: string;
  name: string | null;
};

export type UserProfile = {
  created_at: string;
  default_habits_seeded: boolean;
  email: string;
  id: string;
};

export type CompetitionSummary = {
  email: string;
  score: number;
  userId: string;
};
