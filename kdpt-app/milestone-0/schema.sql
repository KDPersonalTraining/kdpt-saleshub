-- ============================================================================
-- KDPT App: data model draft (milestone 0)
-- Target: Supabase Postgres (London region), row-level security on every table.
--
-- Conventions
--   * Every table carries org_id. KDPT is the only organisation for now; the
--     column exists so a multi-coach version never needs a rebuild.
--   * Every client-owned row carries client_id so RLS is one simple rule:
--     "a client sees their own rows, staff see their organisation's rows".
--   * IDs are uuids. Rows created on a phone (sessions, sets, meals) get their
--     id on the device, so an offline write replayed twice is an upsert, not a
--     duplicate.
--   * Weights are kg in numeric(6,2); money is integer pence.
--   * Special category (health) data is marked [HEALTH] in comments. Clients
--     see their own; only the coach sees anyone else's; it is never sent to
--     the AI without the client's ai_assistant consent.
-- ============================================================================

create extension if not exists pgcrypto;

create schema if not exists app;

-- ---------------------------------------------------------------------------
-- 1. Identity and clients
-- ---------------------------------------------------------------------------

create table organisations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  -- Branding and AI persona live here, not in code.
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create type user_role as enum ('client', 'coach', 'assistant_coach');

create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  org_id        uuid not null references organisations (id),
  role          user_role not null default 'client',
  full_name     text not null,
  preferred_name text,
  date_of_birth date,                -- onboarding refuses under-18s (adult clients only at launch)
  phone         text,
  text_scale    numeric(3,2) not null default 1.00 check (text_scale between 0.9 and 1.6),
  avatar_path   text,
  created_at    timestamptz not null default now(),
  archived_at   timestamptz
);
create index on profiles (org_id, role);

create table invites (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  email         text not null,
  full_name     text not null,
  role          user_role not null default 'client',
  token_hash    text not null unique,      -- store a hash, never the raw link token
  package_id    uuid,                      -- fk added after packages exists
  expires_at    timestamptz not null default now() + interval '14 days',
  accepted_at   timestamptz,
  created_by    uuid references profiles (id),
  created_at    timestamptz not null default now()
);

create type consent_kind as enum (
  'terms', 'privacy_notice', 'health_data', 'progress_photos',
  'ai_assistant', 'marketing_email'
);

-- Append-only. Withdrawal is a new row with granted = false.
create table consents (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  kind          consent_kind not null,
  granted       boolean not null,
  document_version text not null,          -- e.g. 'privacy-2026-11'
  recorded_at   timestamptz not null default now()
);
create index on consents (client_id, kind, recorded_at desc);

create view current_consents as
select distinct on (client_id, kind) client_id, kind, granted, document_version, recorded_at
from consents
order by client_id, kind, recorded_at desc;

create type coaching_type as enum ('in_person', 'online', 'hybrid', 'programme_only');

create table packages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  name          text not null,              -- '8 PT sessions / month'
  coaching_type coaching_type not null,
  sessions_per_month int not null default 0,
  price_pence   int not null check (price_pence >= 0),
  stripe_price_id text,
  active        boolean not null default true
);

alter table invites
  add constraint invites_package_fk foreign key (package_id) references packages (id);

create table locations (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  name          text not null,
  address       text,
  equipment     text[] not null default '{}',  -- feeds substitution filtering
  active        boolean not null default true
);

-- Chosen by the client at onboarding. More frequent check-ins make the
-- Momentum score more accurate (shown to the client as High / Good / Basic).
create type check_in_frequency as enum ('weekly', 'fortnightly', 'monthly');

-- One row per client: the coaching relationship.
create table client_details (
  client_id     uuid primary key references profiles (id) on delete cascade,
  org_id        uuid not null references organisations (id),
  coaching_type coaching_type not null,
  package_id    uuid references packages (id),
  default_location_id uuid references locations (id),
  goals         text,
  -- [HEALTH] shown as a flag on the profile header and given to every rule.
  restrictions  text,
  home_equipment text[] not null default '{}',
  check_in_frequency check_in_frequency not null default 'weekly',
  check_in_weekday smallint check (check_in_weekday between 1 and 7),  -- ISO; null for monthly
  training_days_per_week smallint check (training_days_per_week between 1 and 7),
  started_on    date,
  stripe_customer_id text,
  -- Learned normal pattern for alerts, e.g. {"usual_sessions_per_week": 3, "travels": true}
  baseline      jsonb not null default '{}'::jsonb
);

-- Questionnaire answers from onboarding; versioned so questions can change.
create table onboarding_responses (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  questionnaire_version text not null,
  answers       jsonb not null,            -- [HEALTH] may include injuries
  submitted_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Exercise library
-- The most important part of the model: substitutions, progression and
-- workout shortening all read these fields.
-- ---------------------------------------------------------------------------

create type movement_pattern as enum (
  'squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push',
  'horizontal_pull', 'vertical_pull', 'carry', 'core_anti_extension',
  'core_anti_rotation', 'core_flexion', 'isolation_upper', 'isolation_lower',
  'conditioning', 'mobility'
);

create type load_type as enum (
  'barbell', 'dumbbell', 'kettlebell', 'machine_stack', 'machine_plate',
  'cable', 'bodyweight', 'band', 'smith', 'other'
);

create table exercises (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  name          text not null,
  slug          text not null,
  movement_pattern movement_pattern not null,
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  equipment     text[] not null default '{}',  -- every item needed, e.g. {'leg_press'}
  load_type     load_type not null,
  is_unilateral boolean not null default false,
  -- Smallest sensible jump. Dumbbells 2kg, most stacks 2.5-5kg, leg press 10kg.
  load_increment_kg numeric(5,2) not null default 2.5,
  -- 1 = easiest variation in its family; lets substitutions go easier/harder.
  difficulty    smallint not null default 2 check (difficulty between 1 and 5),
  -- Setup and stabilisation cost, used by the time-aware shortener.
  setup_minutes numeric(3,1) not null default 1.0,
  cues          text[] not null default '{}',
  common_faults text[] not null default '{}',
  video_id      text,                      -- Bunny/Cloudflare Stream id
  thumbnail_path text,
  everfit_id    text,                      -- migration mapping
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (org_id, slug)
);
create index on exercises (org_id, movement_pattern) where archived_at is null;

create type substitution_reason as enum ('equipment', 'pain', 'preference', 'busy_gym', 'regression', 'progression');

-- Directed edges: "if you can't do A, do B". Ranked per reason.
create table exercise_alternatives (
  exercise_id   uuid not null references exercises (id) on delete cascade,
  alternative_id uuid not null references exercises (id) on delete cascade,
  reason        substitution_reason not null,
  rank          smallint not null default 1,
  note          text,                      -- 'keep the same rep range, start ~20% lighter'
  load_ratio    numeric(4,2),              -- optional starting-load hint vs. original
  primary key (exercise_id, alternative_id, reason),
  check (exercise_id <> alternative_id)
);

-- ---------------------------------------------------------------------------
-- 3. Coaching rules (the rules engine reads these; code stays generic)
-- ---------------------------------------------------------------------------

create type rule_kind as enum ('progression', 'shortening', 'substitution', 'alert');

create table coach_rules (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  kind          rule_kind not null,
  name          text not null,             -- 'Double progression, hit top on all working sets'
  -- Parameters for a rule implemented in TypeScript, e.g.
  -- {"type":"double_progression","all_sets_at_top":true,"min_rir":1,"deload_after_misses":3}
  params        jsonb not null,
  is_default    boolean not null default false,
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Programmes
-- A template is a programme with client_id null. Assigning copies it, so
-- editing a template never silently changes a live plan.
-- ---------------------------------------------------------------------------

create type programme_status as enum ('draft', 'active', 'completed', 'archived');

create table programmes (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid references profiles (id) on delete cascade,  -- null = template
  source_programme_id uuid references programmes (id),
  name          text not null,
  description   text,
  status        programme_status not null default 'draft',
  starts_on     date,
  weeks         smallint,
  created_by    uuid references profiles (id),
  -- Set when the AI drafted this; it stays draft until the coach approves.
  ai_action_id  uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on programmes (client_id, status);
-- One live programme per client.
create unique index one_active_programme on programmes (client_id) where status = 'active';

create table workouts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  programme_id  uuid not null references programmes (id) on delete cascade,
  name          text not null,             -- 'Lower body A'
  day_order     smallint not null,
  focus         text,
  estimated_minutes smallint,              -- computed by the rules engine on save
  notes         text
);
create index on workouts (programme_id, day_order);

-- How an exercise is kept when the client chooses a shorter session.
create type keep_priority as enum ('must_keep', 'keep_if_time', 'first_to_cut');

create table workout_exercises (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  workout_id    uuid not null references workouts (id) on delete cascade,
  exercise_id   uuid not null references exercises (id),
  position      smallint not null,
  superset_group text,                     -- 'A' for A1/A2
  warmup_sets   smallint not null default 0,
  working_sets  smallint not null check (working_sets > 0),
  rep_min       smallint not null,
  rep_max       smallint not null,
  target_rir    smallint,                  -- reps in reserve
  rest_seconds  smallint not null default 90,
  tempo         text,                      -- '3-1-1-0'
  start_load_kg numeric(6,2),              -- first-week suggestion
  priority      keep_priority not null default 'keep_if_time',
  -- Minimum sets kept when shortened; null = rules engine decides.
  min_sets_when_short smallint,
  progression_rule_id uuid references coach_rules (id),
  coach_note    text,
  check (rep_min <= rep_max)
);
create index on workout_exercises (workout_id, position);

-- ---------------------------------------------------------------------------
-- 5. Workout logging (offline-first)
-- ---------------------------------------------------------------------------

create type session_status as enum ('in_progress', 'completed', 'abandoned');

create table workout_sessions (
  id            uuid primary key,          -- generated on the device
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  workout_id    uuid references workouts (id),   -- null = freestyle session
  chosen_minutes smallint check (chosen_minutes in (30, 45, 60, 90)),
  status        session_status not null default 'in_progress',
  started_at    timestamptz not null,
  completed_at  timestamptz,
  session_rpe   smallint check (session_rpe between 1 and 10),
  client_note   text,
  synced_at     timestamptz not null default now()
);
create index on workout_sessions (client_id, started_at desc);

create type set_kind as enum ('warmup', 'working', 'drop', 'amrap');

create table set_logs (
  id            uuid primary key,          -- generated on the device
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  session_id    uuid not null references workout_sessions (id) on delete cascade,
  workout_exercise_id uuid references workout_exercises (id),
  -- What was actually performed (differs from the plan after a swap).
  exercise_id   uuid not null references exercises (id),
  set_number    smallint not null,
  kind          set_kind not null default 'working',
  load_kg       numeric(6,2),
  reps          smallint,
  rir           smallint,
  suggested_load_kg numeric(6,2),          -- what the engine proposed, for learning
  completed_at  timestamptz not null,
  -- Last-write-wins on replay: the device stamp, not the server clock.
  device_updated_at timestamptz not null,
  deleted       boolean not null default false
);
create index on set_logs (client_id, exercise_id, completed_at desc);
create index on set_logs (session_id);

create table substitutions (
  id            uuid primary key,
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  session_id    uuid not null references workout_sessions (id) on delete cascade,
  workout_exercise_id uuid not null references workout_exercises (id),
  from_exercise_id uuid not null references exercises (id),
  to_exercise_id uuid not null references exercises (id),
  reason        substitution_reason not null,
  -- Only the coach can make a swap stick for future sessions.
  made_permanent_by uuid references profiles (id),
  created_at    timestamptz not null default now()
);

create type pain_action as enum ('continued', 'swapped', 'skipped_exercise', 'stopped_session');

-- [HEALTH] Always creates an attention item for the coach.
create table pain_reports (
  id            uuid primary key,
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  session_id    uuid references workout_sessions (id) on delete set null,
  exercise_id   uuid references exercises (id),
  body_area     text not null,             -- 'left knee'
  severity      smallint not null check (severity between 0 and 10),
  kind          text,                      -- 'sharp', 'dull ache', 'pins and needles'
  description   text,
  action_taken  pain_action not null,
  reviewed_by   uuid references profiles (id),
  reviewed_at   timestamptz,
  coach_response text,
  created_at    timestamptz not null default now()
);
create index on pain_reports (org_id, reviewed_at) where reviewed_at is null;

-- ---------------------------------------------------------------------------
-- 6. Check-ins and progress
-- One engine: a form is a list of questions; weekly check-ins, monthly
-- reviews and one-off surveys are all forms.
-- ---------------------------------------------------------------------------

create table check_in_forms (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  name          text not null,
  -- [{"id":"sleep","type":"scale","label":"Sleep quality","min":1,"max":5}, ...]
  questions     jsonb not null,
  -- 'FREQ=WEEKLY;BYDAY=SU' or null for on-demand
  schedule_rrule text,
  active        boolean not null default true
);

create table check_in_assignments (
  form_id       uuid not null references check_in_forms (id) on delete cascade,
  client_id     uuid not null references profiles (id) on delete cascade,
  org_id        uuid not null references organisations (id),
  primary key (form_id, client_id)
);

create table check_ins (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  form_id       uuid not null references check_in_forms (id),
  due_on        date not null,
  answers       jsonb,                     -- [HEALTH] may include sleep, stress, pain
  submitted_at  timestamptz,
  reviewed_by   uuid references profiles (id),
  reviewed_at   timestamptz,
  coach_reply   text,
  unique (client_id, form_id, due_on)
);

create type body_metric as enum (
  'bodyweight_kg', 'waist_cm', 'hips_cm', 'chest_cm', 'arm_cm', 'thigh_cm',
  'body_fat_pct', 'resting_hr', 'steps', 'sleep_hours'
);

-- [HEALTH] Narrow rows so new metrics need no migration.
create table body_measurements (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  metric        body_metric not null,
  value         numeric(7,2) not null,
  measured_on   date not null,
  source        text not null default 'manual',  -- later 'apple_health'
  created_at    timestamptz not null default now()
);
create index on body_measurements (client_id, metric, measured_on desc);

-- [HEALTH] Only stored when the client has granted progress_photos consent.
create table progress_photos (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  storage_path  text not null,             -- private bucket, signed URLs only
  pose          text not null check (pose in ('front', 'side', 'back', 'other')),
  taken_on      date not null,
  check_in_id   uuid references check_ins (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. Nutrition (simple logging; no food database at launch)
-- ---------------------------------------------------------------------------

create table nutrition_settings (
  client_id     uuid primary key references profiles (id) on delete cascade,
  org_id        uuid not null references organisations (id),
  show_numbers  boolean not null default false,  -- coach decides per client
  kcal_target   int,
  protein_g_target int,
  carbs_g_target int,
  fat_g_target  int,
  water_ml_target int,
  notes         text
);

create type meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack', 'drink');

create table meals (
  id            uuid primary key,          -- device-generated
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  eaten_at      timestamptz not null,
  slot          meal_slot not null,
  description   text,
  photo_path    text,
  kcal          int,
  protein_g     numeric(5,1),
  recipe_id     uuid,                      -- fk after recipes
  created_at    timestamptz not null default now()
);
create index on meals (client_id, eaten_at desc);

-- Weekly feedback: the AI may draft it, the coach edits and sends.
create table nutrition_feedback (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  week_starting date not null,
  body          text not null,
  ai_action_id  uuid,
  sent_at       timestamptz,
  unique (client_id, week_starting)
);

create table recipes (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  title         text not null,
  summary       text,
  ingredients   jsonb not null default '[]'::jsonb,
  method        jsonb not null default '[]'::jsonb,
  kcal          int,
  protein_g     numeric(5,1),
  photo_path    text,
  tags          text[] not null default '{}',
  publish_at    timestamptz,               -- scheduled drops
  created_at    timestamptz not null default now()
);

alter table meals
  add constraint meals_recipe_fk foreign key (recipe_id) references recipes (id) on delete set null;

-- The food database. Shared rows (org_id null) come from Open Food Facts and
-- are found by search or barcode; KDPT recipes and a client's own quick-adds
-- belong to the organisation. Values are per serving.
create table foods (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organisations (id),
  source        text not null check (source in ('open_food_facts', 'kdpt_recipe', 'client_custom')),
  external_id   text,
  barcode       text,
  name          text not null,
  serving_desc  text not null,             -- '1 slice', '170 g pot'
  serving_g     numeric(6,1),
  kcal          numeric(6,1) not null,
  protein_g     numeric(6,1) not null,
  carbs_g       numeric(6,1) not null,
  fat_g         numeric(6,1) not null,
  recipe_id     uuid references recipes (id) on delete cascade,
  created_by    uuid references profiles (id),
  created_at    timestamptz not null default now(),
  unique (source, external_id)
);
create index on foods (barcode) where barcode is not null;

-- One row per food a client logs. Macros are copied at log time so editing a
-- food never rewrites someone's history. Created on the phone, like set_logs.
create table food_log_items (
  id            uuid primary key,
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  logged_on     date not null,
  slot          meal_slot not null,
  food_id       uuid references foods (id) on delete set null,
  servings      numeric(5,2) not null default 1 check (servings > 0),
  name          text not null,
  kcal          numeric(7,1) not null,
  protein_g     numeric(7,1) not null,
  carbs_g       numeric(7,1) not null,
  fat_g         numeric(7,1) not null,
  meal_id       uuid references meals (id) on delete set null,   -- optional photo
  created_at    timestamptz not null default now()
);
create index on food_log_items (client_id, logged_on);

-- ---------------------------------------------------------------------------
-- 8. Scheduling
-- Coach publishes availability; clients self-book within their allowance.
-- ---------------------------------------------------------------------------

create table availability_rules (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  coach_id      uuid not null references profiles (id),
  location_id   uuid not null references locations (id),
  weekday       smallint not null check (weekday between 1 and 7),  -- ISO, 1 = Monday
  starts_at     time not null,
  ends_at       time not null,
  slot_minutes  smallint not null default 60,
  valid_from    date not null,
  valid_until   date,
  check (starts_at < ends_at)
);

-- One-off blocks and extra openings (holidays, a Saturday morning).
create table availability_exceptions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  coach_id      uuid not null references profiles (id),
  location_id   uuid references locations (id),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  kind          text not null check (kind in ('blocked', 'extra')),
  reason        text
);

-- A client's regular slot, used to pre-book on the 20th.
create table standing_slots (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  location_id   uuid not null references locations (id),
  weekday       smallint not null check (weekday between 1 and 7),
  starts_at     time not null,
  active        boolean not null default true
);

create table booking_allowances (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  month         date not null check (extract(day from month) = 1),
  sessions_allowed smallint not null,
  carried_over  smallint not null default 0,
  released_at   timestamptz,               -- the 20th-of-the-month job sets this
  unique (client_id, month)
);

create type booking_status as enum ('held', 'confirmed', 'cancelled', 'late_cancelled', 'no_show', 'completed');

create table bookings (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  coach_id      uuid not null references profiles (id),
  location_id   uuid not null references locations (id),
  allowance_id  uuid references booking_allowances (id),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        booking_status not null default 'confirmed',
  google_event_id text,
  cancelled_at  timestamptz,
  -- true when cancelled inside the policy window; the session counts as used.
  counts_against_allowance boolean not null default true,
  created_at    timestamptz not null default now(),
  check (starts_at < ends_at)
);
create index on bookings (coach_id, starts_at);
create index on bookings (client_id, starts_at);

-- Postgres itself refuses a double-booking for the coach.
create extension if not exists btree_gist;
-- Clients don't move bookings themselves (organisations.settings.booking_mode
-- = 'coach_schedules', the default); they ask, and the coach decides.
create type change_request_status as enum ('pending', 'approved', 'declined', 'countered');

create table booking_change_requests (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  booking_id    uuid not null references bookings (id) on delete cascade,
  requested_starts_at timestamptz not null,
  client_note   text,
  status        change_request_status not null default 'pending',
  coach_reply   text,
  countered_starts_at timestamptz,
  decided_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- The coach's Google Calendar. Busy times are read from it (times only, never
-- titles) and every booking and block is written back to it.
create table calendar_connections (
  coach_id      uuid primary key references profiles (id) on delete cascade,
  org_id        uuid not null references organisations (id),
  provider      text not null default 'google',
  calendar_id   text not null,
  refresh_token_encrypted bytea not null,  -- server only: no RLS policy grants access
  sync_token    text,
  last_synced_at timestamptz
);

create table calendar_busy (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  coach_id      uuid not null references profiles (id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  external_id   text not null,
  unique (coach_id, external_id)
);
create index on calendar_busy (coach_id, starts_at);

alter table bookings add constraint no_coach_overlap
  exclude using gist (coach_id with =, tstzrange(starts_at, ends_at) with &&)
  where (status in ('held', 'confirmed'));

-- ---------------------------------------------------------------------------
-- 9. Payments
-- ---------------------------------------------------------------------------

create table subscriptions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  package_id    uuid not null references packages (id),
  stripe_subscription_id text unique,
  status        text not null,             -- mirrors Stripe: active, past_due, canceled
  current_period_end timestamptz,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. Messaging, notifications, feed
-- ---------------------------------------------------------------------------

-- One thread per client with the coaching team keeps the timeline whole.
create table messages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  sender_id     uuid references profiles (id),   -- null = system / assistant
  sender_kind   text not null check (sender_kind in ('client', 'coach', 'assistant', 'system')),
  body          text not null,
  attachment_path text,
  read_by_client_at timestamptz,
  read_by_coach_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index on messages (client_id, created_at desc);

create table notification_preferences (
  profile_id    uuid primary key references profiles (id) on delete cascade,
  org_id        uuid not null references organisations (id),
  -- {"workout_reminder":{"push":true,"email":false}, "bookings_open":{...}}
  channels      jsonb not null default '{}'::jsonb,
  quiet_from    time default '21:00',
  quiet_until   time default '07:00'
);

create table push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles (id) on delete cascade,
  endpoint      text not null unique,
  keys          jsonb not null,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create table notifications (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  profile_id    uuid not null references profiles (id) on delete cascade,
  -- 'booking_open', 'session_reminder', 'payment_due', 'payment_overdue',
  -- 'weekly_drop', 'check_in_due', 'workout_reminder', 'message'
  kind          text not null,
  title         text not null,
  body          text,
  link          text,
  sent_push_at  timestamptz,
  sent_email_at timestamptz,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create table posts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  author_id     uuid not null references profiles (id),
  -- client_post is the only kind a client can create.
  kind          text not null check (kind in ('announcement', 'weekly_drop', 'tip', 'recipe', 'question', 'poll', 'challenge', 'client_post')),
  title         text,
  body          text not null,
  payload       jsonb not null default '{}'::jsonb,   -- weekly_drop: {"tip": ..., "recipe_ids": [3 ids]}; poll options
  audience      coaching_type[],                      -- null = everyone
  publish_at    timestamptz not null default now(),
  pinned        boolean not null default false,
  hidden_at     timestamptz,                          -- set by a coach; hidden from clients
  hidden_by     uuid references profiles (id),
  created_at    timestamptz not null default now()
);

create table post_comments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  post_id       uuid not null references posts (id) on delete cascade,
  author_id     uuid not null references profiles (id) on delete cascade,
  body          text not null check (length(body) between 1 and 2000),
  hidden_at     timestamptz,
  created_at    timestamptz not null default now()
);
create index on post_comments (post_id, created_at);

create table post_reactions (
  post_id       uuid not null references posts (id) on delete cascade,
  profile_id    uuid not null references profiles (id) on delete cascade,
  org_id        uuid not null references organisations (id),
  reaction      text not null,
  primary key (post_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- 11. Coach-only notes, timeline, attention queue, AI audit
-- ---------------------------------------------------------------------------

-- Never visible to the client (RLS below).
create table coach_notes (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  author_id     uuid not null references profiles (id),
  body          text not null,
  pinned        boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Every event also lands here; the client timeline is a single query.
create table timeline_events (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  kind          text not null,             -- 'workout_completed', 'pain_reported', 'check_in_submitted'
  source_table  text not null,
  source_id     uuid not null,
  summary       text not null,             -- 'Lower body A, 52 min, 2 PRs'
  visible_to_client boolean not null default true,
  occurred_at   timestamptz not null
);
create index on timeline_events (client_id, occurred_at desc);

create type attention_status as enum ('open', 'snoozed', 'resolved', 'dismissed');

-- Rule-based at launch. Each item says why it fired.
create table attention_items (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid not null references profiles (id) on delete cascade,
  rule_id       uuid references coach_rules (id),
  kind          text not null,             -- 'pain_reported', 'missed_sessions', 'unanswered_message'
  severity      smallint not null default 2 check (severity between 1 and 3),
  reason        text not null,             -- 'No workout logged for 9 days; usual gap is 2-3'
  source_table  text,
  source_id     uuid,
  status        attention_status not null default 'open',
  snoozed_until timestamptz,
  resolved_by   uuid references profiles (id),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);
create index on attention_items (org_id, status, severity desc, created_at);
-- One open item per cause, so a nightly job can re-run safely.
create unique index one_open_item_per_cause on attention_items (client_id, kind, source_id)
  where status in ('open', 'snoozed');

-- Every AI call and every coach decision on it. The approval centre is a
-- filtered view of this table.
create type ai_action_status as enum ('auto_applied', 'pending_approval', 'approved', 'edited_and_approved', 'rejected', 'escalated', 'failed');

create table ai_actions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations (id),
  client_id     uuid references profiles (id) on delete set null,
  requested_by  uuid references profiles (id),
  tool          text not null,             -- 'answer_question', 'suggest_swap', 'draft_programme'
  model         text not null,
  input_summary text not null,             -- what context was sent, not the raw health data
  output        jsonb not null,
  status        ai_action_status not null,
  decided_by    uuid references profiles (id),
  decided_at    timestamptz,
  input_tokens  int,
  output_tokens int,
  created_at    timestamptz not null default now()
);
create index on ai_actions (org_id, status, created_at desc);

alter table programmes add constraint programmes_ai_fk foreign key (ai_action_id) references ai_actions (id);
alter table nutrition_feedback add constraint nutrition_feedback_ai_fk foreign key (ai_action_id) references ai_actions (id);

-- Who changed what. Written by triggers on sensitive tables and by server code.
create table audit_log (
  id            bigint generated always as identity primary key,
  org_id        uuid,
  actor_id      uuid,
  action        text not null,             -- 'update', 'export', 'delete_request', 'view_health_record'
  table_name    text,
  row_id        uuid,
  detail        jsonb,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 12. Row-level security
-- ---------------------------------------------------------------------------

-- Helpers are security definer so policies don't recurse into profiles' RLS.
create or replace function app.my_org() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid() and archived_at is null
$$;

create or replace function app.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('coach', 'assistant_coach') from profiles
      where id = auth.uid() and archived_at is null),
    false)
$$;

create or replace function app.is_coach() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'coach' from profiles where id = auth.uid() and archived_at is null),
    false)
$$;

-- Enable RLS everywhere. A table without a policy is closed by default.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

-- Pattern A: client-owned rows. Client reads/writes own; staff read/write org.
do $$
declare t text;
begin
  foreach t in array array[
    'workout_sessions', 'set_logs', 'substitutions', 'meals', 'food_log_items',
    'body_measurements', 'check_ins'
  ] loop
    execute format($p$
      create policy client_own on %1$I for all
        using (client_id = auth.uid())
        with check (client_id = auth.uid() and org_id = app.my_org());
      create policy staff_org on %1$I for all
        using (app.is_staff() and org_id = app.my_org())
        with check (app.is_staff() and org_id = app.my_org());
    $p$, t);
  end loop;
end $$;

-- Pattern B: [HEALTH] rows the client creates. Only the coach (not an
-- assistant coach) sees other people's. Clients can't edit after submitting.
do $$
declare t text;
begin
  foreach t in array array['pain_reports', 'progress_photos', 'onboarding_responses'] loop
    execute format($p$
      create policy client_read on %1$I for select using (client_id = auth.uid());
      create policy client_insert on %1$I for insert
        with check (client_id = auth.uid() and org_id = app.my_org());
      create policy coach_all on %1$I for all
        using (app.is_coach() and org_id = app.my_org())
        with check (app.is_coach() and org_id = app.my_org());
    $p$, t);
  end loop;
end $$;

-- Consents: client inserts own (append-only), everyone reads own, coach reads org.
create policy client_read on consents for select using (client_id = auth.uid());
create policy client_insert on consents for insert
  with check (client_id = auth.uid() and org_id = app.my_org());
create policy coach_read on consents for select using (app.is_coach() and org_id = app.my_org());

-- Pattern C: client reads own, staff manage (plans, feedback, allowances).
do $$
declare t text;
begin
  foreach t in array array[
    'client_details', 'nutrition_settings', 'nutrition_feedback',
    'booking_allowances', 'standing_slots', 'subscriptions',
    'timeline_events', 'check_in_assignments'
  ] loop
    execute format($p$
      create policy client_read on %1$I for select using (client_id = auth.uid());
      create policy staff_org on %1$I for all
        using (app.is_staff() and org_id = app.my_org())
        with check (app.is_staff() and org_id = app.my_org());
    $p$, t);
  end loop;
end $$;

-- Timeline: hide coach-only events from the client.
drop policy client_read on timeline_events;
create policy client_read on timeline_events for select
  using (client_id = auth.uid() and visible_to_client);

-- Pattern D: staff-only tables. Clients never see these rows.
do $$
declare t text;
begin
  foreach t in array array['coach_notes', 'attention_items', 'ai_actions', 'invites', 'coach_rules',
                           'availability_exceptions'] loop
    execute format($p$
      create policy staff_org on %1$I for all
        using (app.is_staff() and org_id = app.my_org())
        with check (app.is_staff() and org_id = app.my_org());
    $p$, t);
  end loop;
end $$;

-- Pattern E: org-wide reference data. Everyone in the org reads; staff write.
do $$
declare t text;
begin
  foreach t in array array['exercises', 'packages', 'locations', 'check_in_forms',
                           'recipes', 'posts', 'availability_rules'] loop
    execute format($p$
      create policy org_read on %1$I for select using (org_id = app.my_org());
      create policy staff_write on %1$I for all
        using (app.is_staff() and org_id = app.my_org())
        with check (app.is_staff() and org_id = app.my_org());
    $p$, t);
  end loop;
end $$;

-- The group feed. Clients see published, unhidden posts (and their own), can
-- write client_post entries and delete their own; coaches moderate everything.
drop policy org_read on posts;
create policy org_read on posts for select
  using (org_id = app.my_org()
         and (app.is_staff() or (publish_at <= now() and (hidden_at is null or author_id = auth.uid()))));
create policy client_post on posts for insert
  with check (author_id = auth.uid() and kind = 'client_post' and org_id = app.my_org()
              and hidden_at is null and not pinned);
create policy own_delete on posts for delete using (author_id = auth.uid());

create policy org_read on post_comments for select
  using (org_id = app.my_org() and (hidden_at is null or app.is_staff() or author_id = auth.uid()));
create policy own_write on post_comments for insert
  with check (author_id = auth.uid() and org_id = app.my_org() and hidden_at is null);
create policy own_delete on post_comments for delete using (author_id = auth.uid());
create policy staff_all on post_comments for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());

-- Foods: everyone reads the shared database and their organisation's foods.
create policy read_foods on foods for select using (org_id is null or org_id = app.my_org());
create policy client_custom on foods for insert
  with check (source = 'client_custom' and created_by = auth.uid() and org_id = app.my_org());
create policy staff_write on foods for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());

-- Booking changes: a client asks; only staff decide.
create policy client_read on booking_change_requests for select using (client_id = auth.uid());
create policy client_ask on booking_change_requests for insert
  with check (client_id = auth.uid() and status = 'pending' and org_id = app.my_org()
              and exists (select 1 from bookings b where b.id = booking_id and b.client_id = auth.uid()));
create policy staff_org on booking_change_requests for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());

-- calendar_busy is staff-only; calendar_connections has no policy at all.
create policy staff_org on calendar_busy for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());
drop policy org_read on recipes;
create policy org_read on recipes for select
  using (org_id = app.my_org() and (publish_at is null or publish_at <= now() or app.is_staff()));

create policy org_read on exercise_alternatives for select
  using (exists (select 1 from exercises e where e.id = exercise_id and e.org_id = app.my_org()));
create policy staff_write on exercise_alternatives for all
  using (app.is_staff() and exists (select 1 from exercises e where e.id = exercise_id and e.org_id = app.my_org()))
  with check (app.is_staff() and exists (select 1 from exercises e where e.id = exercise_id and e.org_id = app.my_org()));

-- Programmes: clients read their own non-draft plans only. Templates are staff-only.
create policy client_read on programmes for select
  using (client_id = auth.uid() and status <> 'draft');
create policy staff_org on programmes for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());

create policy client_read on workouts for select
  using (exists (select 1 from programmes p where p.id = programme_id
                 and p.client_id = auth.uid() and p.status <> 'draft'));
create policy staff_org on workouts for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());

create policy client_read on workout_exercises for select
  using (exists (select 1 from workouts w join programmes p on p.id = w.programme_id
                 where w.id = workout_id and p.client_id = auth.uid() and p.status <> 'draft'));
create policy staff_org on workout_exercises for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());

-- Profiles: you see yourself; staff see the org; clients see staff names.
create policy self_read on profiles for select using (id = auth.uid());
create policy self_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'client');   -- a client can't promote themselves
create policy see_staff on profiles for select
  using (org_id = app.my_org() and role in ('coach', 'assistant_coach'));
create policy staff_org on profiles for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_coach() and org_id = app.my_org());

create policy own_org on organisations for select using (id = app.my_org());

-- Messages: clients read their thread and post as themselves.
create policy client_read on messages for select using (client_id = auth.uid());
create policy client_send on messages for insert
  with check (client_id = auth.uid() and sender_id = auth.uid()
              and sender_kind = 'client' and org_id = app.my_org());
create policy staff_org on messages for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());

-- Bookings: clients see and create their own; allowance checks happen in a
-- server function, so direct inserts are limited to 'held'.
create policy client_read on bookings for select using (client_id = auth.uid());
create policy client_hold on bookings for insert
  with check (client_id = auth.uid() and status = 'held' and org_id = app.my_org());
create policy staff_org on bookings for all
  using (app.is_staff() and org_id = app.my_org())
  with check (app.is_staff() and org_id = app.my_org());

-- Personal settings and notifications.
create policy own_rows on notification_preferences for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy own_rows on push_subscriptions for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy own_read on notifications for select using (profile_id = auth.uid());
create policy own_mark_read on notifications for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy own_reactions on post_reactions for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and org_id = app.my_org());
create policy org_read on post_reactions for select using (org_id = app.my_org());

-- audit_log: no policies. Only the service role (server code) reads or writes it.
