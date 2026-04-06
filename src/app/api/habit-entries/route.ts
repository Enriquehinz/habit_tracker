import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getHabitForUser, upsertHabitEntry } from "@/lib/habit-store";

type RequestBody = {
  completed?: boolean;
  date?: string;
  habitId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const { habitId, date, completed } = body;

  if (!habitId || !date || typeof completed !== "boolean") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const habit = await getHabitForUser(user.id, habitId);

  if (!habit) {
    return NextResponse.json({ error: "Habit not found." }, { status: 404 });
  }

  const entry = await upsertHabitEntry({
    completed,
    date,
    habitId,
    userId: user.id,
  });

  if (!entry) {
    return NextResponse.json({ error: "Unable to save habit entry." }, { status: 500 });
  }

  return NextResponse.json({ entry });
}
