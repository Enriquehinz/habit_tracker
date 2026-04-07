import { redirect } from "next/navigation";

import { ALLOWED_EMAILS } from "@/lib/constants";
import { getReadOnlyAuthSession } from "@/lib/auth/server";
import type { AuthUser } from "@/lib/types";

const allowedEmails = new Set(ALLOWED_EMAILS.map((email) => email.toLowerCase()));

export function isAllowedEmail(email: string) {
  return allowedEmails.has(email.trim().toLowerCase());
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { user } = await getReadOnlyAuthSession();

  if (!user?.email) {
    return null;
  }

  if (!isAllowedEmail(user.email)) {
    return null;
  }

  return {
    email: user.email,
    id: user.id,
    name: user.name ?? null,
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
