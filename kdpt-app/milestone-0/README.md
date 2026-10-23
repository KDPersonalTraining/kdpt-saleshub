# KDPT App: milestone 0

Design and data foundations for the KDPT client app, as set out in the product
blueprint (15 Oct 2026). Nothing in this folder is part of the sales site build.

| File | What it is |
|---|---|
| `prototype.html` | Client app prototype: Home, Train, the workout flow, Fuel, Progress and messages with Kyle. Sample data. |
| `coach-portal.html` | Coach portal prototype: Today, Clients, a client profile with programme and nutrition editing, Programmes, Schedule, Messages, Library and Automation. |
| `assets/` | Photos, recipe images and the KD monogram, cropped from the sales site's own images. |
| `schema.sql` | Draft Postgres schema for Supabase: every table, enum and row-level security policy. |
| `rls-test.sql` | Runs the schema against plain Postgres with Supabase stubs, then checks who can see what. |

## Testing the prototype with clients

Milestone 0 is done when 3–4 clients of mixed ages can finish a mock workout
without help. For each tester:

1. Hand them the phone on **Client Home** and say only "start today's workout".
2. Watch, don't help. Note where they hesitate.
3. Ask them to log the first set, change the session to 30 minutes, swap an
   exercise and report pain.
4. Ask which parts felt like *you* and which felt generic.

Things to watch for: whether older clients use the **Aa** text-size button,
whether anyone misses the tick button, and whether the "weight goes up today"
explanation makes sense to them.

## The data model

The schema follows the seven modules in the blueprint. The main decisions:

- **Organisation on every row.** `org_id` is everywhere and RLS enforces it.
  KDPT is the only organisation, but a multi-coach version needs no rebuild.
- **The exercise library holds the coaching logic.** Movement pattern, muscles,
  equipment, load increment, difficulty and setup time sit on `exercises`.
  Ranked `exercise_alternatives` are linked by reason (equipment, pain,
  busy gym). Substitutions, the overload engine and the 30/45/60/90 shortener
  all read these fields.
- **Each prescribed exercise carries a shortening priority.** On
  `workout_exercises` this is `must_keep`, `keep_if_time` or `first_to_cut`.
  The prototype shows the rule working on real numbers.
- **Coaching rules are data.** `coach_rules` stores the parameters (for
  example "double progression, top of the range on every working set").
  Tested TypeScript applies them.
- **Templates are copied, never shared.** Assigning a template creates a new
  programme for the client. Editing a template never changes a live plan.
  There can only be one active programme per client.
- **Workout logging survives a basement gym.** Sessions, sets, swaps, pain
  reports and meals get their id on the phone. Replaying a queued write is an
  upsert, and the device timestamp decides between conflicting edits.
- **One timeline.** Every event also writes to `timeline_events`, so the client
  profile's Timeline tab is one query.
- **The attention queue is plain rules at launch.** Every `attention_items` row
  carries a written `reason`. A unique index stops the nightly job raising the
  same alert twice.
- **AI drafts need your approval.** Every AI call is a row in `ai_actions`. A
  drafted programme stays `draft`, and clients can't see drafts. The approval
  centre is a filtered view of that table.
- **Double-bookings are refused by the database.** An exclusion constraint on
  `bookings` stops two live bookings for the coach from overlapping.
- **Health data is locked down harder.** `pain_reports`, `progress_photos` and
  onboarding answers are readable by the client and the head coach only, not
  assistant coaches. Clients can't edit them after sending. Consents are
  append-only. The app is adults-only for now, so there is no guardian flow.

### Running the access checks

```bash
createdb kdpt_test
psql -q -t -d kdpt_test -f rls-test.sql
```

There are 22 checks. Among them, Jo can't see any of Sam's data, Sam can't see
AI drafts, templates or coach notes, Sam can't make themselves a coach, and a
double-booking is refused. All of them pass on Postgres 16.

### Known gaps to close in milestone 1

- Clients can currently update coach-owned columns on `check_ins` (for example
  `coach_reply`). Restrict that with column grants or a submit function.
- Allowance checks for bookings belong in a server function. Today, clients can
  only insert a `held` booking.
- There are no `updated_at` triggers, timeline-writing triggers or audit
  triggers yet.
- Storage bucket policies for photos and videos aren't written yet.

## Decisions (21 Oct 2026)

| Question | Answer | What it changes |
|---|---|---|
| Pilot or single launch | One launch with everything, then keep improving | Roadmap below |
| Everfit renewal | Monthly, at the end of each month | Launch on the 1st of a month and cancel Everfit at the end of that month, so you never pay for two systems for long |
| Filming | Quiet day, Wednesday 28 October | Shot list and filming notes below |
| Under-18 clients | None | Guardian consent removed. Onboarding refuses anyone under 18; add the flow back if you ever take younger clients |

Still open: the assistant's name.

### Showing data without overwhelming (21 Oct)

The app mixes three reference apps, in three layers:

1. **Glance (Oura).** Home shows one Momentum word ("Strong") and one
   sentence. No numbers to decode.
2. **Tap (Whoop).** Tapping Momentum shows what built it: training, fuel and
   recovery, each with a status, plus this week's trend.
3. **Explore (Apple Fitness).** Progress holds the charts, rings and awards
   for clients who want the detail.

Momentum is a word, not a score out of 100, as the blueprint recommended.

### Onboarding, community, notifications and payments (21 Oct)

- **Onboarding** (the prototype opens on it; add `#home` to the link to skip):
  welcome, goal, training days, check-in frequency (weekly, every 2 weeks,
  monthly, plus a day), then notification choices. The frequency sets
  Momentum's accuracy label: High, Good or Basic. Stored on
  `client_details.check_in_frequency`.
- **Community tab**: the weekly drop (a tip plus 3 high-protein meals,
  each saveable to Fuel), announcements and past drops. Reactions only, no
  client-to-client chat. You schedule it from the portal's Community page.
- **Notifications**: the bell on Home opens an inbox with booking, session,
  payment, weekly drop and check-in items, each with its action. A sample
  push banner shows how they arrive on the phone. Clients choose which types
  they get.
- **Booking**: November's regular slots are pre-held, and the client confirms
  or drops dates. The 24-hour change window is a placeholder until you
  confirm your cancellation policy.
- **Payments**: the reminder opens a Stripe-style payment sheet with an
  optional monthly auto-pay.

### Prices and cancellation (23 Oct)

- **Cancellation:** 24 hours. Later cancellations count as a used session.
- **Packages:** 2 PT sessions £90, 4 PT £150, 8 PT £260 a month, and online
  coaching £120 a month. Programme-only isn't part of the app.
- **Price changes:** the portal's Payments page lets you change a package
  price for **new clients only**, or for **everyone on it** from a date you
  choose. Clients get at least 30 days' notice. Each client's own price is
  stored on their subscription, so older prices stay put until you move them.
  The older prices shown for Tom and Ellie are sample data.
- **Per-client control:** every client row in Payments has **Adjust**, for a
  discount (% or £ off, for one month, 3 months or until stopped) or their own
  monthly price. Rises give 30 days' notice. Each change is stored in
  `price_adjustments`, so there's a full history.
- **Working hours:** Monday, Tuesday, Thursday and Friday 6:30–20:00
  (finish time assumed), Wednesday 6:30–13:00, no Saturdays or Sundays. You
  can change them in Schedule → Edit hours. Clients can't offer times outside
  them, and the calendar shades everything else.
- **Two kinds of client:** regular clients get their usual slots proposed
  automatically. Clients whose times change send rough windows ("Tue from
  16:30, Thu from 14:00"). KAI drafts exact times that keep your day free of
  gaps, and you adjust and confirm. Windows are stored in `client_availability`.
- **Bookings need your approval:** whether you propose a session and the client
  accepts it, or the client enters one, it stays pending (`held`) until you
  confirm it in Schedule → Waiting for your approval. The client sees
  "pending" until then and gets a notification when you confirm.

### Kyle and KAI (21 Oct)

Clients talk to two separate parties, and the app never mixes them in one
thread:

| | Kyle | KAI (AI assistant) |
|---|---|---|
| Look | KD monogram with a mint ring | Violet orb |
| Where | Monogram button on Home, top right | KAI button on Home, the "Need an answer now?" row in Kyle's chat, swap sheet |
| Replies | Within a few hours, as chat bubbles | Instantly, as plain answers that show what they were based on |
| Hands over | – | Pain, injury and plan changes go to Kyle and are marked "Passed to your coach" for the client and appear in his thread with a "handed over" note |

In the portal, everything the AI writes is labelled "KAI draft".

### Bookings, Fuel, Progress and Community rebuilt (22 Oct)

- **Bookings: you schedule.** The default mode is "You schedule". On the 20th,
  each client gets the month's sessions placed in their regular slots. They
  confirm, or ask to move one to a time you have free, and you approve, offer
  another time or decline in the portal's Schedule page. A "Clients pick"
  mode exists if you ever want self-booking.
- **Google Calendar** is connected once. Anything already in it counts as busy
  (times only, titles are never stored), and every session and block you add
  is written back to it. Block time off in the portal (one-off or weekly) or
  just add it to Google Calendar. Tables: `calendar_connections`,
  `calendar_busy`, `booking_change_requests`.
- **Fuel** is a real tracker:
  - It shows a calories ring, protein, carbs and fat bars, and meals grouped
    by breakfast, lunch, snacks and dinner.
  - Food is added by search, barcode, KDPT recipes or quick add.
  - A water tracker and your weekly review sit at the bottom.
  - In the portal, a week-in-review table colours each day on target, under or
    over (±10%).
  - Data lives in `foods` (shared Open Food Facts rows plus KDPT recipes) and
    `food_log_items`, with macros copied at log time.
- **Progress** has four tabs:
  - **Strength:** pick a lift and see every session's top set, estimated 1-rep
    max and change, plus "Total lifted" with a plain explanation.
  - **Records:** this month's personal bests and what counts as one.
  - **Body:** measurements, photos, step-by-step how-to guides, and weight off
    by default.
  - **Consistency:** a labelled day-by-week calendar with a key.
- **Community** has two tabs:
  - **Feed:** a group chat where you and clients post, like and comment. The
    question of the week is pinned.
  - **Library:** sorted into Meals, Weekly tips (Wednesdays), Question of the
    week (Mondays), Announcements, and Challenges & more.
  - Coaches can hide anything. Clients can only create `client_post` entries
    and delete their own.
- **Icons** sit in a bordered tile tinted with their own colour.

The access checks now cover food logs, group posts, comments and hiding, with
30 checks in total.

### Check-ins and icons (22 Oct)

The check-in is four short steps, with feelings first and the scale last:

1. **How are you feeling?** Five moods (Rough to Great) and a free-text note.
2. **How was your week?** Sleep, energy, stress, food and motivation on 1–5
   scales, plus any aches.
3. **Wins beyond the scale.** Opens with "Would you rather lose 5 lbs, or look
   like you've lost 5 lbs?", followed by tickable wins (clothes fit better,
   more energy, lifting heavier and so on). A progress photo and
   measurements or weight are optional and hidden by default.
4. **How can your coach help?** Support options (more accountability, help
   with food, a call, encouragement) and a note.

Answers go into `check_ins.answers`, so the questions can change without a
migration. The portal's Check-ins tab shows mood, the client's own words,
wins, scores and what support they asked for.

Icons are a custom solid two-tone set, shown as plain white glyphs the
way the tab bar shows them. Colour appears only where it means something:
mint for training and selection, coral for pain, violet for KAI, and the ring
colours on Momentum. KAI's mark is the open arc of the D in the KD logo. Mood
in the check-in is a single colour shape with a slider, similar to Apple
Health's State of Mind, and the 1–5 scores are fill-up meters.

### Visual style (21 Oct)

Labels are plain text with a colour dot instead of pill-shaped tags. Related
rows sit in grouped lists with hairline dividers, Apple style. Headline titles
are uppercase and buttons are square-cornered, Gymshark style. The tab bar is
flat.

### Colour system (redesign, 21 Oct)

Black and mint stay as the brand. Each area of the app also has its own
colour, so it never all blurs into black and green:

| Colour | Used for |
|---|---|
| Mint `#7ED597` | Training, main buttons, progress |
| Amber `#FFB45E` | Nutrition |
| Violet `#A99BFF` | Check-ins and the assistant |
| Sky `#6EC6FF` | PT sessions and bookings |
| Coral `#FF6B5E` | Pain and anything needing attention |

### Launch roadmap

The milestones stay as building steps, but nothing goes to clients until launch
day. The one safeguard kept from the pilot idea is a **dress rehearsal**: you
and 2–3 friendly clients train on the finished app for three weeks while
everyone else stays on Everfit. That is where lost sets, confusing screens
and sync bugs show up, before 35 clients meet them on the same morning.

| Step | Weeks | Done by (approx.) |
|---|---|---|
| 0. Prototype tested with 3–4 clients; exercises filmed | 1 | end of October |
| 1–3. App skeleton, library and programme builder, workout logging | 8–9 | late December |
| 4–6. Profiles, check-ins, messaging, scheduling, payments, nutrition, content | 8–9 | late February |
| 7–10. AI assistant, approval centre, nutrition feedback, Momentum, duration adjuster | 8–9 | late April (optional for launch, see below) |
| Dress rehearsal with 2–3 clients | 3 | |
| Import history, onboard everyone, launch | 1–2 | |

At 10–15 hours a week that gives two realistic launch dates:

- **1 April 2027** with the core app (training, check-ins, messaging,
  booking, payments, nutrition log, feed). The AI features follow as updates.
- **1 June 2027** with the AI assistant, approvals and Momentum included.

Either way, cancel Everfit at the end of launch month once every client has
logged in and their history is visible.

### Filming day checklist (28 October)

- Film the 50–60 exercises you programme most. Everything else can be added
  over time.
- Phone in landscape on a tripod, at hip height, side-on unless the movement
  reads better from the front. Leave space around you; the app crops to a wide
  frame.
- 3–4 clean reps per clip at normal tempo. Start and end in the same
  position so the clip loops smoothly.
- No talking needed: the clips play muted, and cues are written in the app.
- Same clothes, plain background and good light for every clip, so the library
  looks like one set.
- Name each file by exercise as you go (`leg-press.mov`). It saves an hour
  of sorting later.
