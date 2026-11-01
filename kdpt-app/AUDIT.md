# KDPT app — audit and plan

Audit of `kdpt-app/app` against Kyle's development brief (1 November 2026).
"Demo" means it runs on sample data in the browser only, with no database.

## Where things stand

**Production-ready foundations**

- Sign-in by emailed 6-digit code: invite-only, with separate client and coach areas.
- Role checks: clients can't open the coach portal, and the coach can't open the client area. Covered by tests.
- Database design: tables for every feature, with row-level security on all of them. There are 32 access checks; a client can never read another client's rows.
- Coaching rules, with 22 tests:
  - double progression (when the weight goes up)
  - fitting a workout into 30, 45, 60 or 90 minutes
  - estimated 1-rep max
- Demo mode is clearly separated from live mode (`KDPT_LIVE=1`), so demo data and real client data never mix.

**Working in demo, needs improving**

| Area | Issue |
| --- | --- |
| Workout logging | Tapping a number doesn't select it, so typing adds to it. No input checks. No RPE, notes or "skipped". The rest timer can't be paused, and stops if you leave the screen. |
| Workout summary | Time, total kg (as a fallback) and "New best · Leg Press" are fixed numbers, not worked out from what was logged. |
| Exercise video | Shows "Kyle's demo" over a stock photo, but nothing has been filmed. |
| KAI | Canned answers in demo. Swap options include starting loads that nobody set (70 kg, 24 kg). |
| Payments (client) | Says "paid automatically on the 1st", and payment "succeeds" with a receipt, although no payment system is connected. |
| Payments (coach) | Says cards are charged through Stripe on the 1st, and "Stripe updated". Not true: Stripe isn't connected, and not every client pays the same way or on the same day. |
| Schedule | Shows "Google Calendar synced 2 min ago" and "added to both calendars". Google Calendar isn't connected. |
| Booking states | A requested change shows as "Asked for…" before it's sent. There's no visible state between proposed, awaiting Kyle and confirmed. |
| Hannah (new client) | After sign-up she sees Sarah's programme, week 6, session history, PT session and payment notices. |
| Accessibility | Secondary text is low contrast. No reduced-motion support. On a phone, the keyboard can cover the workout buttons. |

**Partly built**

- Nutrition:
  - food search and quick add work
  - no portion or gram sizes, favourites or recent foods
  - barcode scanning is a placeholder
- Progress:
  - charts, records, body and consistency views work
  - no comparison periods (1, 3, 6 months)
  - no monthly report
- Community:
  - feed, likes, comments and library work
  - no polls, and the challenge wall is a single post
- Coach dashboard: alerts and approvals work, but most actions only show a message instead of doing the task.
- Client profile:
  - training, nutrition and check-in tabs work
  - no contact details, notes, bookings, payments or messages tabs
- Programme builder:
  - the editor works
  - no tempo or intensity, no workout library, no version history
  - nothing is saved
- Check-in builder: works, but answers aren't stored and there are no reminders or AI summaries.

**Missing (needs the database or an outside service)**

- Saving anything for real: every screen still reads sample data.
- Invites and the code email.
- Offline queue for workouts.
- Stripe payments.
- Google Calendar sync.
- KAI connected to Claude.
- Push notifications.
- Photo storage.
- Monthly reports.
- Multiple locations and travel buffers.

## Plan

Work goes in this order. Each step is tested and pushed before the next.

1. **Truthfulness.** Remove every claim the app can't back up: invented loads, "Kyle's demo", automatic payments, Stripe and Google sync messages, fixed summary numbers. Label demo-only actions as demo.
2. **Workout logging (Phase 1 §1).**
   - Tapping a number selects it.
   - Inputs are checked; sets are saved as you go and survive leaving the app.
   - Target, last time and today are clearly separate.
   - Optional RPE and notes per set; skip or modify an exercise.
   - The rest timer can be paused and keeps time across screens.
   - The summary is worked out from what was logged, including real personal records.
3. **New-client consistency.** Hannah sees an honest empty state ("Kyle is building your programme"), not Sarah's history.
4. **Booking states.** Every session shows one clear state: Proposed, Awaiting you, Change requested, Awaiting Kyle, Confirmed, Declined or Cancelled. Nothing says "sent" until it has been sent.
5. **Accessibility pass.** Contrast, reduced motion, keyboard and dock behaviour, and the text size setting.
6. **Database wiring.** Workout logging, onboarding answers and bookings first, then food and check-ins, with an offline queue.
7. **Coach workspace.** Alerts with real actions, a complete client profile, booking generation from regular patterns, and payments with due dates and methods set per client.
8. **Integrations, each verified before it says "connected":**
   - Stripe
   - Google Calendar
   - KAI through Claude (approved swaps and logged history only, with escalation)
9. **Phase 2–4 features:**
   - nutrition portions and favourites
   - progress comparison periods and monthly reports
   - the challenge wall and polls
   - programme versioning

## Progress log

### 1 November: plan steps 1–5 (first pass)

- **Truthfulness.**
  - Swap options no longer carry invented loads.
  - KAI's swap answer lists only the swaps saved for that exercise.
  - "Kyle's demo" is now "How to do it", linking to the written steps.
  - Payment screens no longer claim card payments, receipts, Stripe or automatic collection. Each client has their own way of paying, due date and status.
  - The schedule says Google Calendar isn't connected.
  - The coach portal shows a Demo badge.
- **Workout logging.**
  - Tapping a number selects all of it, on a first or later tap.
  - Weights and reps are checked; anything invalid is flagged and can't be ticked.
  - Clear Set / kg / Reps headings, with "last" under each, and the target as weight × reps.
  - Optional RPE (6–10) and a note per exercise; skip an exercise.
  - The rest timer can be paused, resumed, extended and skipped, and keeps counting while away (stored as an end time).
  - The whole workout survives leaving the app, and Home shows "In progress".
  - The summary is worked out from logged sets: time, sets, kg and real personal records against history.
  - The bottom buttons hide while the keyboard is open.
- **New client.** Hannah sees a getting-started checklist, "Your programme is on its way", her own notifications, and no history, sessions or bests.
- **Booking states.**
  - Change requests read "not sent yet" until sent.
  - After sending, every session shows "Awaiting Kyle".
  - Nothing reads as confirmed until Kyle confirms it.
- **Accessibility.**
  - Secondary text contrast raised from about 4:1 to about 6.6:1.
  - The phone's reduce-motion setting is respected.

**Tested with:**

- Unit tests (30), including input checks and the summary.
- An automated browser run of a whole workout: typing over a value, a rejected entry, pausing the rest timer, leaving and returning, RPE and a note, skipping, and the summary.
- Hannah's sign-up and her screens.
- The booking flow.
- The coach payments and schedule pages.
