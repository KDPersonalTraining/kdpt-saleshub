# Setting up the database (Kyle's side)

About 15 minutes. You do everything in your Supabase project; nothing changes
in the live app until the last step, which you leave until Claude says the
screens are ready.

## 1. Build the tables

1. Open your project at supabase.com. In the left menu, click **SQL Editor**, then **New query**.
2. On GitHub, open `kdpt-app/app/supabase/migrations/20261030000000_initial_schema.sql` and click **Raw**. Select all and copy.
3. Paste it into the SQL Editor and click **Run**. It should finish with "Success. No rows returned".

If you see an error, screenshot it and send it to Claude. Don't run it again.

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

## 4. Later: switch off demo mode

Don't do this yet. The screens still use sample data, so real clients
wouldn't see their own information.

When Claude confirms they're ready: Vercel → **kdpt-app** → **Settings** →
**Environment Variables** → add `KDPT_LIVE` with the value `1`, then
**Deployments** → **Redeploy**. From then on the sign-in page sends a real
code to your email.

## Other things only you can do

- **ICO:** register with the Information Commissioner's Office and pay the data protection fee (ico.org.uk). Add the number to the privacy notice.
- **Legal drafts:** fill in your business details and have a solicitor check the privacy notice, terms and DPIA.
- **Two-factor authentication:** turn it on for Supabase, Vercel, GitHub and (later) Stripe.
- **Filming:** the app tour video (`public/media/kdpt-tour.mp4`) and exercise demos. Send the files to Claude to add.
- **Stripe** (when ready for payments): create an account and complete the business verification.
