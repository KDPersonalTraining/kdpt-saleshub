-- Local check of schema.sql against plain Postgres 16.
-- Stubs the bits of Supabase the schema uses (auth.users, auth.uid(), the
-- authenticated role), seeds a coach and two clients, then asserts what each
-- person can see.
--   createdb kdpt_test
--   psql -q -t -d kdpt_test -f rls-test.sql
\set ON_ERROR_STOP on

-- Supabase stubs ------------------------------------------------------------
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

\ir schema.sql

grant usage on schema public, app, auth to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema app, auth to authenticated;

-- Seed ----------------------------------------------------------------------
insert into organisations (id, name, slug) values
  ('00000000-0000-0000-0000-00000000000a', 'KD Personal Training', 'kdpt');
insert into auth.users values
  ('00000000-0000-0000-0000-000000000001'),  -- Kyle (coach)
  ('00000000-0000-0000-0000-000000000002'),  -- client Sam
  ('00000000-0000-0000-0000-000000000003');  -- client Jo
insert into profiles (id, org_id, role, full_name) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'coach',  'Kyle'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'client', 'Sam'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000a', 'client', 'Jo');

insert into exercises (id, org_id, name, slug, movement_pattern, equipment, load_type, load_increment_kg) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000a',
   'Leg press', 'leg-press', 'squat', '{leg_press}', 'machine_plate', 10),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-00000000000a',
   'Goblet squat', 'goblet-squat', 'squat', '{dumbbell}', 'dumbbell', 2);
insert into exercise_alternatives values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2', 'equipment', 1, null, 0.3);

-- Kyle's template, Sam's live plan and Sam's draft (drafts are hidden from clients).
insert into programmes (id, org_id, client_id, name, status) values
  ('00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-00000000000a', null,
   'Beginner full body template', 'active'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000002', 'Sam block 1', 'active'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000002', 'Sam block 2 (AI draft)', 'draft');
insert into workouts (id, org_id, programme_id, name, day_order) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-0000000000b1', 'Lower body A', 1);
insert into workout_exercises (id, org_id, workout_id, exercise_id, position, working_sets, rep_min, rep_max) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000e1', 1, 3, 10, 12);
insert into coach_notes (org_id, client_id, author_id, body) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', 'Private: knee history, keep depth comfortable.');

-- Helper: run the rest as a signed-in user ------------------------------------
create function pg_temp.as_user(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, false);
end $$;

create function pg_temp.expect(label text, got bigint, want bigint) returns void language plpgsql as $$
begin
  if got is distinct from want then
    raise exception 'FAIL %: got %, want %', label, got, want;
  end if;
  raise notice 'ok   %', label;
end $$;

set role authenticated;

-- Sam (client) ----------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');

insert into workout_sessions (id, org_id, client_id, workout_id, started_at) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c1', now());
insert into set_logs (id, org_id, client_id, session_id, workout_exercise_id, exercise_id,
                      set_number, load_kg, reps, completed_at, device_updated_at) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1',
   1, 120, 12, now(), now());
-- Replaying the same offline write is an upsert, not a duplicate.
insert into set_logs (id, org_id, client_id, session_id, workout_exercise_id, exercise_id,
                      set_number, load_kg, reps, completed_at, device_updated_at) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1',
   1, 120, 12, now(), now())
on conflict (id) do update set load_kg = excluded.load_kg, reps = excluded.reps,
  device_updated_at = excluded.device_updated_at
  where set_logs.device_updated_at <= excluded.device_updated_at;
insert into pain_reports (id, org_id, client_id, session_id, exercise_id, body_area, severity, action_taken) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-0000000000e1', 'left knee', 4, 'swapped');

select pg_temp.expect('Sam sees own set logs',        (select count(*) from set_logs), 1);
select pg_temp.expect('Sam sees own live programme',  (select count(*) from programmes), 1);
select pg_temp.expect('Sam cannot see AI draft',      (select count(*) from programmes where status = 'draft'), 0);
select pg_temp.expect('Sam cannot see templates',     (select count(*) from programmes where client_id is null), 0);
select pg_temp.expect('Sam sees workout + exercises', (select count(*) from workout_exercises), 1);
select pg_temp.expect('Sam cannot see coach notes',   (select count(*) from coach_notes), 0);
select pg_temp.expect('Sam sees exercise library',    (select count(*) from exercises), 2);
select pg_temp.expect('Sam sees Kyle, not Jo',        (select count(*) from profiles), 2);
update pain_reports set severity = 0;
select pg_temp.expect('Sam cannot edit pain report', (select count(*) from pain_reports where severity = 0), 0);

do $$ begin
  insert into set_logs (id, org_id, client_id, session_id, exercise_id, set_number, completed_at, device_updated_at)
  values (gen_random_uuid(), '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000003',
          '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', 2, now(), now());
  raise exception 'FAIL Sam wrote a set as Jo';
exception when insufficient_privilege then raise notice 'ok   Sam cannot write as Jo';
end $$;

do $$ begin
  update profiles set role = 'coach' where id = auth.uid();
  if (select role from profiles where id = auth.uid()) = 'coach' then
    raise exception 'FAIL Sam promoted themselves';
  end if;
exception when insufficient_privilege then null;
end $$;
select pg_temp.expect('Sam cannot promote self', (select count(*) from profiles where role = 'coach' and id = auth.uid()), 0);

-- Sam logs food and posts to the group.
insert into food_log_items (id, org_id, client_id, logged_on, slot, name, kcal, protein_g, carbs_g, fat_g) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000002', current_date, 'breakfast', 'Greek yoghurt 0%', 100, 17, 6, 0);
insert into posts (id, org_id, author_id, kind, body) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000002', 'client_post', '10k done!');
select pg_temp.expect('Sam sees own post', (select count(*) from posts), 1);
do $$ begin
  insert into posts (org_id, author_id, kind, body) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', 'announcement', 'Studio closed');
  raise exception 'FAIL Sam posted an announcement';
exception when insufficient_privilege then raise notice 'ok   Sam cannot post announcements';
end $$;

-- Jo (client) -----------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select pg_temp.expect('Jo cannot see Sam''s sets',     (select count(*) from set_logs), 0);
select pg_temp.expect('Jo cannot see Sam''s sessions', (select count(*) from workout_sessions), 0);
select pg_temp.expect('Jo cannot see Sam''s pain',     (select count(*) from pain_reports), 0);
select pg_temp.expect('Jo cannot see Sam''s plan',     (select count(*) from programmes), 0);
select pg_temp.expect('Jo cannot see Sam''s profile',  (select count(*) from profiles where full_name = 'Sam'), 0);
select pg_temp.expect('Jo cannot see Sam''s food log', (select count(*) from food_log_items), 0);
select pg_temp.expect('Jo sees Sam''s group post',     (select count(*) from posts), 1);
insert into post_comments (org_id, post_id, author_id, body) values
  ('00000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Amazing!');
select pg_temp.expect('Jo can comment', (select count(*) from post_comments), 1);
delete from posts where id = '50000000-0000-0000-0000-000000000001';
select pg_temp.expect('Jo cannot delete Sam''s post', (select count(*) from posts), 1);

-- Kyle (coach) ----------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect('Kyle sees all programmes incl. drafts', (select count(*) from programmes), 3);
select pg_temp.expect('Kyle sees Sam''s sets',  (select count(*) from set_logs), 1);
select pg_temp.expect('Kyle sees pain report',  (select count(*) from pain_reports), 1);
select pg_temp.expect('Kyle sees coach notes',  (select count(*) from coach_notes), 1);
select pg_temp.expect('Kyle sees all profiles', (select count(*) from profiles), 3);
select pg_temp.expect('Kyle sees Sam''s food log', (select count(*) from food_log_items), 1);
update posts set hidden_at = now(), hidden_by = auth.uid() where id = '50000000-0000-0000-0000-000000000001';

select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select pg_temp.expect('Jo cannot see a hidden post', (select count(*) from posts), 0);
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');

-- Database refuses a coach double-booking.
reset role;
insert into locations (id, org_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'Studio');
insert into bookings (org_id, client_id, coach_id, location_id, starts_at, ends_at) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f1',
   '2026-11-02 07:00+00', '2026-11-02 08:00+00');
do $$ begin
  insert into bookings (org_id, client_id, coach_id, location_id, starts_at, ends_at) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000f1',
     '2026-11-02 07:30+00', '2026-11-02 08:30+00');
  raise exception 'FAIL double booking accepted';
exception when exclusion_violation then raise notice 'ok   double booking refused';
end $$;

\echo 'All RLS checks passed.'
