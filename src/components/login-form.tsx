"use client";

import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";

import { submitLogin, type LoginActionState } from "@/app/login/actions";

export function LoginForm() {
  const initialState: LoginActionState = { error: null, message: null };
  const [state, formAction, isPending] = useActionState(submitLogin, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border bg-[var(--card)] p-6 shadow-sm backdrop-blur">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <div className="flex items-center gap-3 rounded-2xl border bg-[var(--card-strong)] px-4">
          <Mail className="h-4 w-4 text-[var(--muted)]" />
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-12 w-full bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="flex items-center gap-3 rounded-2xl border bg-[var(--card-strong)] px-4">
          <LockKeyhole className="h-4 w-4 text-[var(--muted)]" />
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="At least 8 characters"
            className="h-12 w-full bg-transparent outline-none"
          />
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Only the two approved email addresses can access this app. Use{" "}
        <span className="font-medium text-[var(--foreground)]">Create account</span>{" "}
        once per allowed email, then use <span className="font-medium text-[var(--foreground)]">Sign in</span>.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="submit"
          name="mode"
          value="signin"
          disabled={isPending}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] text-sm font-semibold text-[var(--background)] transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>

        <button
          type="submit"
          name="mode"
          value="signup"
          disabled={isPending}
          className="flex h-12 items-center justify-center rounded-2xl border bg-[var(--card-strong)] text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          Create account
        </button>
      </div>

      {state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
      {state.error ? <p className="text-sm text-rose-500">{state.error}</p> : null}
    </form>
  );
}
