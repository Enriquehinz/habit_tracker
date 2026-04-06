import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-5">
          <div className="inline-flex rounded-full border bg-[var(--card)] px-3 py-1 text-sm text-[var(--muted)]">
            Simple shared habit tracking
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Daily consistency, visualized like a contribution graph.
            </h1>
            <p className="max-w-xl text-base text-[var(--muted)] sm:text-lg">
              Log today&apos;s habits in seconds and review the last 12 months at a
              glance, one calm square at a time.
            </p>
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
