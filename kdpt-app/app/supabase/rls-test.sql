-- Local check of the migrations against plain Postgres 16.
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

\ir migrations/20261030000000_initial_schema.sql
\ir migrations/20261105000000_client_app_state.sql
\ir migrations/20261106000000_api_grants.sql
\ir migrations/20261109000000_programmes_messages_checkins.sql
\ir migrations/20261109000000_programmes_messages_checkins.sql
\ir migrations/20261110000000_cardio.sql
\ir migrations/20261110000000_cardio.sql

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
insert into posts (id, org_id, author_id, kind, title, body) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000001', 'tip', 'Front-load your protein', 'Aim for 30g at breakfast.');
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
select pg_temp.expect('Sam sees Kyle''s group post', (select count(*) from posts), 1);
do $$ begin
  insert into posts (org_id, author_id, kind, body) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', 'client_post', '10k done!');
  raise exception 'FAIL Sam posted while client posting is off';
exception when insufficient_privilege then raise notice 'ok   Sam cannot post while posting is off';
end $$;
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
select pg_temp.expect('Jo sees Kyle''s group post',    (select count(*) from posts), 1);
insert into post_comments (org_id, post_id, author_id, body) values
  ('00000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Amazing!');
select pg_temp.expect('Jo can comment', (select count(*) from post_comments), 1);
delete from posts where id = '50000000-0000-0000-0000-000000000001';
select pg_temp.expect('Jo cannot delete Kyle''s post', (select count(*) from posts), 1);

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

-- The consents view must not leak other clients' choices.
reset role;
insert into consents (org_id, client_id, kind, granted, document_version) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', 'health_data', true, 'privacy-2026-11'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000003', 'health_data', true, 'privacy-2026-11');
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select pg_temp.expect('Jo sees only her own consents through the view', (select count(*) from current_consents), 1);
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect('Kyle sees both clients'' consents', (select count(*) from current_consents), 2);

-- Each client's app data: own row only; the head coach can read; nobody can
-- write someone else's.
reset role;
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
insert into client_app_state (client_id, org_id, state) values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', '{"onb":{"done":true}}');
update client_app_state set state = '{"onb":{"done":true},"water":3}', version = version + 1 where client_id = auth.uid();
select pg_temp.expect('Sam saves and updates his own app data', (select version from client_app_state), 2);
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select pg_temp.expect('Jo cannot see Sam''s app data', (select count(*) from client_app_state), 0);
do $$ begin
  insert into client_app_state (client_id, org_id, state) values
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', '{}');
  raise exception 'FAIL Jo wrote Sam''s app data';
exception when insufficient_privilege or unique_violation then raise notice 'ok   Jo cannot write Sam''s app data';
end $$;
update client_app_state set state = '{}' where client_id = '00000000-0000-0000-0000-000000000002';
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
select pg_temp.expect('Jo''s update did not touch Sam''s data', (select (state->>'water')::int from client_app_state), 3);
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect('Kyle can read Sam''s app data', (select count(*) from client_app_state), 1);

-- Step 4: logged workouts, messages and check-ins, as the app writes them.
reset role;
update workouts set week_from = 1, week_to = 3, phase = 'Learn the basics' where id = '00000000-0000-0000-0000-0000000000c1';
do $$ begin
  update workouts set week_from = 4, week_to = 2 where id = '00000000-0000-0000-0000-0000000000c1';
  raise exception 'FAIL weeks out of order accepted';
exception when check_violation then raise notice 'ok   a workout''s weeks must be in order';
end $$;
insert into check_in_forms (id, org_id, name, questions, is_default) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'Check-in', '[{"id":"mood","type":"mood","q":"How are you?","req":true}]', true);
do $$ begin
  insert into check_in_forms (org_id, name, questions, is_default) values ('00000000-0000-0000-0000-00000000000a', 'Second', '[]', true);
  raise exception 'FAIL two default forms';
exception when unique_violation then raise notice 'ok   one usual check-in form per business';
end $$;
set role authenticated;

-- Sam finishes a workout: the session and its sets, made on his phone.
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
select pg_temp.expect('Sam sees his programme''s phase', (select count(*) from workouts where phase = 'Learn the basics'), 1);
insert into workout_sessions (id, org_id, client_id, workout_id, status, started_at, completed_at) values
  ('00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-0000000000c1', 'completed', now() - interval '50 minutes', now());
insert into set_logs (id, org_id, client_id, session_id, workout_exercise_id, exercise_id, set_number, load_kg, reps, completed_at, device_updated_at) values
  ('00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000005a1',
   '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1', 1, 100, 12, now(), now());
-- Sending the same workout again (a retry from the phone) changes nothing.
insert into set_logs (id, org_id, client_id, session_id, workout_exercise_id, exercise_id, set_number, load_kg, reps, completed_at, device_updated_at) values
  ('00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000005a1',
   '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1', 1, 100, 12, now(), now())
  on conflict (id) do update set reps = excluded.reps;
select pg_temp.expect('Sam''s set is saved once', (select count(*) from set_logs where session_id = '00000000-0000-0000-0000-0000000005a1'), 1);
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select pg_temp.expect('Jo cannot see Sam''s workouts', (select count(*) from workout_sessions) + (select count(*) from set_logs), 0);
do $$ begin
  insert into workout_sessions (id, org_id, client_id, status, started_at) values
    ('00000000-0000-0000-0000-0000000005a2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', 'completed', now());
  raise exception 'FAIL Jo logged a workout as Sam';
exception when insufficient_privilege then raise notice 'ok   Jo cannot log a workout as Sam';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
select pg_temp.expect('Kyle sees Sam''s workout and sets', (select count(*) from workout_sessions where id = '00000000-0000-0000-0000-0000000005a1') + (select count(*) from set_logs where session_id = '00000000-0000-0000-0000-0000000005a1'), 2);

-- Messages: Kyle and Sam write; Sam marks Kyle's as read; Jo sees none.
insert into messages (org_id, client_id, sender_id, sender_kind, body) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'coach', 'Great session');
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
insert into messages (org_id, client_id, sender_id, sender_kind, body) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'client', 'Thanks!');
do $$ begin
  insert into messages (org_id, client_id, sender_id, sender_kind, body) values
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'coach', 'Pretending to be Kyle');
  raise exception 'FAIL Sam sent a message as the coach';
exception when insufficient_privilege then raise notice 'ok   Sam cannot send as the coach';
end $$;
select mark_messages_read();
select pg_temp.expect('Sam marked Kyle''s message read, not his own', (select count(*) from messages where read_by_client_at is not null), 1);
select pg_temp.expect('Sam''s own message stays unread by him', (select count(*) from messages where sender_kind = 'client' and read_by_client_at is null), 1);
update messages set body = 'edited' where sender_kind = 'coach';
select pg_temp.expect('Sam cannot edit Kyle''s message', (select count(*) from messages where body = 'edited'), 0);
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select mark_messages_read();
select pg_temp.expect('Jo sees no messages', (select count(*) from messages), 0);

-- Check-ins: Kyle changes Sam's next round; Sam answers it; Jo can't see it.
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
insert into check_ins (org_id, client_id, form_id, due_on, questions) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000f1', '2026-11-15',
   '[{"id":"mood","type":"mood","q":"How are you?","req":true},{"id":"steps","type":"number","q":"Steps?","req":false}]');
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
select pg_temp.expect('Sam reads the usual form', (select count(*) from check_in_forms), 1);
insert into check_ins (org_id, client_id, form_id, due_on, answers, submitted_at) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000f1', '2026-11-15', '{"mood":3}', now())
  on conflict (client_id, form_id, due_on) do update set answers = excluded.answers, submitted_at = excluded.submitted_at;
select pg_temp.expect('Sam''s answers saved on the round Kyle changed', (select count(*) from check_ins where submitted_at is not null and jsonb_array_length(questions) = 2), 1);
select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select pg_temp.expect('Jo cannot see Sam''s check-in', (select count(*) from check_ins), 0);
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');
update check_ins set reviewed_at = now(), reviewed_by = auth.uid(), coach_reply = 'Nice week';
select pg_temp.expect('Kyle replies to the check-in', (select count(*) from check_ins where coach_reply is not null), 1);

-- Cardio: a row logged as distance and time.
select pg_temp.as_user('00000000-0000-0000-0000-000000000002');
insert into set_logs (id, org_id, client_id, session_id, exercise_id, set_number, distance_m, duration_s, completed_at, device_updated_at) values
  ('00000000-0000-0000-0000-0000000005b2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000005a1',
   '00000000-0000-0000-0000-0000000000e2', 2, 1250, 300, now(), now());
select pg_temp.expect('Sam logs a distance and time', (select count(*) from set_logs where distance_m = 1250 and duration_s = 300), 1);
reset role;
do $$ begin
  update exercises set measure = 'laps';
  raise exception 'FAIL unknown measure accepted';
exception when check_violation then raise notice 'ok   exercises are measured in reps or distance only';
end $$;
set role authenticated;

\echo 'All RLS checks passed.'
