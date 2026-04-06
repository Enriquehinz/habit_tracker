import { neon } from "@neondatabase/serverless";

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL.");
  }

  return neon(process.env.DATABASE_URL);
}
