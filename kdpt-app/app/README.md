# KDPT app

The real app: a Next.js PWA on Supabase. The designs it follows are the
prototypes in `../milestone-0`.

## What's here

| Path | What it does |
| --- | --- |
| `src/proxy.ts` | Runs on every request: refreshes the sign-in cookie and sends signed-out visitors to `/sign-in`. |
| `src/app/sign-in` | Sign in with an emailed 6-digit code. Invite-only: unknown emails get the same reply and no account. |
| `src/app/(client)` | Client area (`/home`). Its layout only lets clients in. |
| `src/app/(coach)` | Coach area (`/coach`). Its layout only lets the coach and assistant coaches in. |
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

## Next steps

- Invites: the coach's "Add client" creates the auth user, the `profiles` row
  and the `invites` row, then emails the code.
- Onboarding screens, then Train (workout logging with an offline queue).
