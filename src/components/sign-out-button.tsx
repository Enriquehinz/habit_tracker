import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { getAuthServer } from "@/lib/auth/server";

export function SignOutButton() {
  async function signOut() {
    "use server";

    const auth = getAuthServer();
    await auth.signOut();
    redirect("/login");
  }

  return (
    <form action={signOut}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full border bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </form>
  );
}
