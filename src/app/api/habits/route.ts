import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createHabitForUser } from "@/lib/habit-store";

type RequestBody = {
  name?: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  const name = body.name ?? "";
  const result = await createHabitForUser(user.id, name);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (!result.habit) {
    return NextResponse.json({ error: "Unable to create habit." }, { status: 500 });
  }

  return NextResponse.json({ habit: result.habit });
}
