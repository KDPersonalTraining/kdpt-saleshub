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
