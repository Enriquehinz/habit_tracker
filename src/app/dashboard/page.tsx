import { format, subDays } from "date-fns";

import { DashboardClient } from "@/components/dashboard-client";
import { SignOutButton } from "@/components/sign-out-button";
import { requireCurrentUser } from "@/lib/auth/session";
import { YEAR_RANGE_DAYS } from "@/lib/constants";
import {
  ensureDefaultHabits,
  getHabitEntriesForUser,
  getHabitsForUser,
} from "@/lib/habit-store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  await ensureDefaultHabits(user.id);

  const habits = await getHabitsForUser(user.id);

  const startDate = format(subDays(new Date(), YEAR_RANGE_DAYS - 1), "yyyy-MM-dd");
  const entries = await getHabitEntriesForUser(user.id, startDate);

  return (
    <div className="pb-10">
      <div className="mx-auto flex w-full max-w-7xl justify-end px-4 pt-4 sm:px-6">
        <SignOutButton />
      </div>
      <DashboardClient habits={habits} initialEntries={entries} userEmail={user.email} />
    </div>
  );
}
