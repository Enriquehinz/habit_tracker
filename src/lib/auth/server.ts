import { createAuthServer } from "@neondatabase/auth/next/server";
import { cookies } from "next/headers";

type ReadOnlySessionResponse = {
  session: {
    id: string;
  } | null;
  user: {
    email?: string | null;
    id: string;
    name?: string | null;
  } | null;
};

export function getAuthServer() {
  if (!process.env.NEON_AUTH_BASE_URL) {
    throw new Error("Missing NEON_AUTH_BASE_URL.");
  }

  return createAuthServer();
}

export async function getReadOnlyAuthSession() {
  if (!process.env.NEON_AUTH_BASE_URL) {
    throw new Error("Missing NEON_AUTH_BASE_URL.");
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (!cookieHeader) {
    return {
      session: null,
      user: null,
    } satisfies ReadOnlySessionResponse;
  }

  const response = await fetch(`${process.env.NEON_AUTH_BASE_URL}/get-session`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      session: null,
      user: null,
    } satisfies ReadOnlySessionResponse;
  }

  const data = (await response.json().catch(() => null)) as ReadOnlySessionResponse | null;

  return (
    data ?? {
      session: null,
      user: null,
    }
  );
}
