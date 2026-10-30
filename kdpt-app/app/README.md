# KDPT app

The real app: a Next.js PWA on Supabase. The designs it follows are the
prototypes in `../milestone-0`.

## Demo mode

Until the Supabase settings are added, the app runs in **demo mode**: every
screen works on sample data, and the sign-in page lets you pick who to be:

- **Sarah**, a current client (six weeks of workouts, food, progress, bookings)
- **Hannah**, a brand-new client (starts at onboarding)
- **Kyle**, the coach (the full coach portal)

Anything you do is kept in that browser only. In Sarah's profile, "Demo only ·
preview states" turns on the no-signal, payment-failed and new-client screens,
and "Reset the demo" clears what you've logged. Adding the two Supabase values
switches demo mode off automatically.

## What's here

| Path | What it does |
| --- | --- |
| `src/proxy.ts` | Runs on every request: refreshes the sign-in cookie and sends signed-out visitors to `/sign-in`. |
| `src/app/sign-in` | Sign in with an emailed 6-digit code. Invite-only: unknown emails get the same reply and no account. |
| `src/app/(client)` | Client app: Home, Train, Workout, History, exercise Library, Fuel, Progress, Community, messages, KAI, check-in, notifications, profile, onboarding (`/welcome`). Only clients get in. |
| `src/app/(coach)` | Coach portal under `/coach`: Today, Clients and each client's profile, Programmes and the template editor, Check-ins, Schedule, Messages, Payments, Community, Library, Automation. Only the coach and assistant coaches get in. |
| `src/components` | The shared icon set, the client app frame (tab bar, sheets, toasts) and the coach portal frame. |
| `src/lib/client`, `src/lib/coach` | Sample data for demo mode, in the shapes the database queries will return. The client app's local store also lives here. |
| `src/lib/auth` | Roles (`client`, `coach`, `assistant_coach`) and the `requireArea` check. |
| `src/lib/rules` | The coaching rules, with tests: double progression, fitting a workout into the time available, estimated 1-rep max. |
| `supabase/migrations` | The database: tables, row-level security and helper functions. |
| `supabase/rls-test.sql` | 32 access checks (a client can't see another client's data, and so on). |

## Run it

```bash
cp .env.example .env.local   # then fill in the two Supabase values
npm install
npm run dev                  # http://localhost:3000
npm test                     # coaching rules and roles
npm run typecheck
```

## Supabase set-up (one time)

1. Create a project in the **London** region.
2. Apply `supabase/migrations/*.sql` (Supabase CLI: `supabase db push`).
3. Authentication → Sign In / Providers → Email: turn off "Allow new users to
   sign up" (invite-only), and set the email OTP expiry to 600 seconds.
4. Authentication → Email templates → Magic link: include `{{ .Token }}` so the
   email shows the 6-digit code.
5. Create Kyle's account and a `profiles` row with role `coach`.

## Next steps (after Supabase and Vercel are set up)

1. Replace the sample data with database reads and writes, screen by screen,
   starting with Add client (invite and code email), onboarding answers, and
   workout logging with an offline queue.
2. Stripe for packages and payments, Google Calendar for busy times, and KAI
   through the Claude API on the server.
