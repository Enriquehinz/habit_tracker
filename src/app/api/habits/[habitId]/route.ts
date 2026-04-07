import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { deleteHabitForUser, renameHabitForUser } from "@/lib/habit-store";

type RouteContext = {
  params: Promise<{
    habitId: string;
  }>;
};

type RequestBody = {
  name?: string;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { habitId } = await context.params;
  const body = (await request.json()) as RequestBody;
  const result = await renameHabitForUser(user.id, habitId, body.name ?? "");

  if ("error" in result) {
    const status = result.error === "Habit not found." ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (!result.habit) {
    return NextResponse.json({ error: "Unable to rename habit." }, { status: 500 });
  }

  return NextResponse.json({ habit: result.habit });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { habitId } = await context.params;
  const deleted = await deleteHabitForUser(user.id, habitId);

  if (!deleted) {
    return NextResponse.json({ error: "Habit not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
