# Setting up the database (Kyle's side)

About 15 minutes. You do everything in your Supabase project; nothing changes
in the live app until the last step, which you leave until Claude says the
screens are ready.

## 1. Build the tables

1. Open your project at supabase.com. In the left menu, click **SQL Editor**, then **New query**.
2. On GitHub, open `kdpt-app/app/supabase/migrations/20261030000000_initial_schema.sql` and click **Raw**. Select all and copy.
3. Paste it into the SQL Editor and click **Run**. It should finish with "Success. No rows returned".

If you see an error, screenshot it and send it to Claude. Don't run it again.

### 1b. Add the client data table (added 5 November)

If you set up the database before 5 November, run one more file the same way:
`kdpt-app/app/supabase/migrations/20261105000000_client_app_state.sql`
(on GitHub, click **Raw**, copy all, paste into a new query, **Run**). This is
where each client's app data is saved. Run it once.

### 1c. Let the app reach the tables (added 6 November)

Run `kdpt-app/app/supabase/migrations/20261106000000_api_grants.sql` the same
way. Newer Supabase projects don't open tables to the app by default; without
this, signing in says your account isn't set up. Safe to run twice.

### 1d. Programmes, messages and check-ins (added 9 November)

Run `kdpt-app/app/supabase/migrations/20261109000000_programmes_messages_checkins.sql`
the same way. It lets programmes change from phase to phase, turns on instant
messages, and lets you change a check-in's questions for one round. Safe to
run twice.

### 1e. Cardio and programme editing (added 11 November)

Run these two files the same way, in this order:
`kdpt-app/app/supabase/migrations/20261110000000_cardio.sql`, then
`kdpt-app/app/supabase/migrations/20261111000000_programme_editing.sql`.
Both are safe to run twice. Until they're run, giving a programme and saving
workouts won't work.

## 2. Create your coach account

1. Left menu, **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email: `kyle.kdpt@gmail.com`. Tick **Auto Confirm User**. Choose any password (you won't use it, since sign-in is by emailed code).
3. Back in **SQL Editor** → **New query**. Paste the contents of `kdpt-app/app/supabase/setup/2-coach-account.sql` and click **Run**.
4. The result should show one row: your email, `coach`, `Kyle`.

## 3. Sign-in settings

1. **Authentication** → **Sign In / Providers** → **Email**:
   - Turn **off** "Allow new users to sign up". Only people you invite can get in.
   - Set **Email OTP Expiration** to `600` (10 minutes).
2. **Authentication** → **Emails** → **Magic Link** template. Replace the body with:

   ```html
   <h2>Your KDPT sign-in code</h2>
   <p>Enter this code in the app:</p>
   <p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
   <p>It lasts 10 minutes. If you didn't ask for it, you can ignore this email.</p>
   ```

   Save.
3. **Authentication** → **URL Configuration** → **Site URL**: `https://kdpt-app.vercel.app`.

## 3b. Before inviting real clients: your own email sender

Supabase's built-in email only sends a handful of emails an hour, which isn't
enough for invites and sign-in codes. Before the soft launch, connect your
own sender: Supabase → **Project Settings** → **Authentication** → **SMTP
Settings**. Use Brevo (free for 300 emails a day): create an account, add and
verify your sending address, then copy its SMTP host, port, login and key into
Supabase. Claude can walk you through it.

## 4. Later: switch off demo mode

Don't do this yet. The screens still use sample data, so real clients
wouldn't see their own information.

When Claude confirms they're ready: Vercel → **kdpt-app** → **Settings** →
**Environment Variables** → add `KDPT_LIVE` with the value `1`, then
**Deployments** → **Redeploy**. From then on the sign-in page sends a real
code to your email.

What works with real data at that point:
- your sign-in, and adding clients (they get a code by email)
- their sign-up answers and consents
- programmes: give a client a starter programme; they train from it and every set comes back to you
- messages, both ways
- check-ins: weekly, fortnightly or monthly, with questions you can change for any one round

Bookings, payments, your Today page and the other coach pages still show
sample data, and each of those pages says so, until they're connected next.

## Other things only you can do

- **ICO:** register with the Information Commissioner's Office and pay the data protection fee (ico.org.uk). Add the number to the privacy notice.
- **Legal drafts:** fill in your business details and have a solicitor check the privacy notice, terms and DPIA.
- **Two-factor authentication:** turn it on for Supabase, Vercel, GitHub and (later) Stripe.
- **Filming:** the app tour video (`public/media/kdpt-tour.mp4`) and exercise demos. Send the files to Claude to add.
- **Stripe** (when ready for payments): create an account and complete the business verification.
