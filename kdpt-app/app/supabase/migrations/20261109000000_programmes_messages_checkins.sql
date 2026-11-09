-- Step 4 of the database: programmes that change as the weeks go on,
-- messages both ways, and check-ins Kyle can change for each round.
-- Safe to run twice.

-- Programmes. A workout can belong to some weeks only, so a programme can
-- bring in new exercises as the client progresses (weeks 1-3, 4-6, ...).
-- Null means every week.
alter table workouts add column if not exists week_from smallint check (week_from >= 1);
alter table workouts add column if not exists week_to smallint check (week_to >= 1);
alter table workouts drop constraint if exists workouts_weeks_order;
alter table workouts add constraint workouts_weeks_order check (week_from is null or week_to is null or week_from <= week_to);
-- What a phase is called on the client's screen ("Learn the basics").
alter table workouts add column if not exists phase text;
-- Which starter programme a client's copy came from.
alter table programmes add column if not exists template_key text;

-- Check-ins. Each round can have its own questions: Kyle starts from the usual
-- ones and adds, removes or rewords them for that client's next check-in.
-- Null means the usual questions.
alter table check_ins add column if not exists questions jsonb;
-- The form every client gets unless Kyle changes a round.
alter table check_in_forms add column if not exists is_default boolean not null default false;
create unique index if not exists check_in_forms_one_default on check_in_forms (org_id) where is_default;

-- Messages. A client marks Kyle's messages as read; they can't edit anything
-- else about a message, so this goes through a function rather than a policy.
create or replace function public.mark_messages_read() returns void
language sql security definer set search_path = public as $$
  update messages set read_by_client_at = now()
  where client_id = auth.uid() and read_by_client_at is null and sender_kind <> 'client'
$$;
revoke all on function public.mark_messages_read() from public;
grant execute on function public.mark_messages_read() to authenticated;

-- New messages arrive straight away (Supabase Realtime). Row-level security
-- still decides who receives which messages.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
    execute 'alter publication supabase_realtime add table messages';
  end if;
end $$;

create index if not exists messages_client_time on messages (client_id, created_at);
create index if not exists set_logs_client_exercise on set_logs (client_id, exercise_id, completed_at desc);
create index if not exists sessions_client_time on workout_sessions (client_id, started_at desc);
