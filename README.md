# Habit Tracker

Minimal GitHub-style habit tracker built with `Next.js`, `TypeScript`, `Tailwind CSS`, `Neon Postgres`, and `Neon Auth`.

## Features

- Private dashboard per user
- Global 12-month contribution graph based on daily completion percentage
- Individual contribution graph for each habit
- Large today toggles with instant save
- Automatic default-habit seeding for first-time users
- Exact email allowlist for only two users
- Responsive mobile + desktop layout
- Basic installable web app metadata (`manifest`, app icons)

## Tech stack

- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`
- `Neon Auth`
- `Neon Postgres` via `@neondatabase/serverless`

## Updated file structure

```text
.
├── .env.example
├── README.md
├── eslint.config.mjs
├── neon/
│   └── 001_init.sql
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── src/
    ├── app/
    │   ├── api/habit-entries/route.ts
    │   ├── apple-icon.tsx
    │   ├── dashboard/page.tsx
    │   ├── globals.css
    │   ├── icon.tsx
    │   ├── layout.tsx
    │   ├── login/
    │   │   ├── actions.ts
    │   │   └── page.tsx
    │   ├── manifest.ts
    │   └── page.tsx
    ├── components/
    │   ├── contribution-heatmap.tsx
    │   ├── dashboard-client.tsx
    │   ├── login-form.tsx
    │   └── sign-out-button.tsx
    └── lib/
        ├── auth/
        │   ├── server.ts
        │   └── session.ts
        ├── constants.ts
        ├── date.ts
        ├── db.ts
        ├── habit-store.ts
        ├── types.ts
        └── utils.ts
```

## Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
NEON_AUTH_BASE_URL=https://your-neon-auth-url
```

## Neon setup

1. Create a Neon project.
2. Enable Neon Auth for the branch you want to use.
3. Copy your Neon Postgres connection string into `DATABASE_URL`.
4. Copy your Neon Auth base URL into `NEON_AUTH_BASE_URL`.
5. Run the SQL in `neon/001_init.sql` against your Neon database.

## Auth behavior

This app uses Neon Auth with server-side actions and session reads.

- Sign-in and sign-up both happen on the existing `login` page
- Route protection is handled by checking the current Neon Auth session in server components and route handlers
- Logout is handled with a server action
- Only these two emails are allowed:
  - `enrique.hinzpeter@getpliant.com`
  - `PUT_WIFE_EMAIL_HERE`

The allowlist is enforced in `src/lib/auth/session.ts` and in `src/app/login/actions.ts`.

Important: replace `PUT_WIFE_EMAIL_HERE` in `src/lib/constants.ts` before using the app.

## First-time account setup

There is no public open signup.

- Allowed users open the login page
- On first use, they click `Create account`
- After that, they use `Sign in`
- Any email not on the allowlist is rejected

## Database schema

The Neon schema creates:

- `habits`
- `habit_entries`

Important rules:

- Each habit belongs to one Neon Auth user ID
- Each entry belongs to one user and one habit
- `habit_entries` has a unique constraint on `(user_id, habit_id, date)`
- `updated_at` is maintained by a trigger

## Seed behavior

On dashboard load, the app ensures the default habits exist for the signed-in user:

- `Exercise`
- `Eating healthy`
- `Meditate (10 mins)`
- `Read (30 mins)`
- `Vibe code (30 mins)`
- `Sleep (7 hours)`
- `Hydrate (2 Liters)`
- `Journaling`

This runs with `insert ... on conflict do nothing`, so duplicates are not created.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Configure `.env.local`.
3. Run `neon/001_init.sql`.
4. Replace `PUT_WIFE_EMAIL_HERE` in `src/lib/constants.ts`.
5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.
7. Create an account once for each allowed email, then sign in.

## Deploying to Vercel

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add these environment variables in Vercel:
   - `DATABASE_URL`
   - `NEON_AUTH_BASE_URL`
4. In Neon Auth, make sure your production app URL is configured correctly.
5. Deploy.

## Migration summary

What changed:

- Supabase auth was replaced with Neon Auth
- Supabase database access was replaced with direct Neon Postgres SQL queries
- Supabase SSR helpers, callback route, middleware, and SQL files were removed
- Route protection now uses direct session checks in server components and route handlers
- The dashboard UI, heatmaps, toggles, streaks, and layout were kept essentially the same

## Notes

- The app stays intentionally small and personal.
- The dashboard still supports dark mode through system preference.
- The PWA support remains lightweight: manifest metadata and generated icons only.
