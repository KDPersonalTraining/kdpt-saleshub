# KDPT App: milestone 0

Design and data foundations for the KDPT client app, as set out in the product
blueprint (15 Oct 2026). Nothing in this folder is part of the sales site build.

| File | What it is |
|---|---|
| `prototype.html` | Clickable prototype of Client Home, Workout and Coach Today, with sample data. Open in a browser, or test on a phone. |
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
  append-only, and guardian details are recorded for under-18s.

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

## Assumptions made without your answer

The blueprint's decision list is still open. These defaults were used so the
work could move forward, and each one is easy to change:

- **Brand colours** are the sales site's: black, `#1E1E1E` cards, mint
  `#7ED597`, Montserrat and Poppins. The brief's `#0B0F0D` and cream were not
  used.
- **Assistant name.** The prototype says "the assistant" until you pick a name.
- **Community** is modelled as a one-way feed with reactions (`posts`,
  `post_reactions`). There is no client-to-client chat.
- **Payments** are modelled now (`packages`, `subscriptions`) for milestone 5.
- **Under-18s.** The full guardian-consent fields are in, since leaving them out
  costs more to fix later than to include now.
