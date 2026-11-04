-- Step 2 of the database: where each client's app data is kept.
--
-- The client app works offline first: everything a client logs (workouts in
-- progress, sets, food, check-ins, sign-up answers) lives on their phone and
-- is copied here whenever there's signal. This table holds that copy, so it
-- follows the client to a new phone and Kyle can see it. Later steps move each
-- part into its own table (workout_sessions, set_logs and so on).
--
-- [HEALTH] state includes health answers and injuries, so only the client and
-- the head coach can read it (not an assistant coach).

create table client_app_state (
  client_id   uuid primary key references profiles (id) on delete cascade,
  org_id      uuid not null references organisations (id),
  state       jsonb not null,
  -- Bumped on every save; a phone with an older copy can tell it's behind.
  version     integer not null default 1,
  updated_at  timestamptz not null default now()
);

alter table client_app_state enable row level security;
alter table client_app_state force row level security;

create policy client_read on client_app_state for select using (client_id = auth.uid());
create policy client_insert on client_app_state for insert
  with check (client_id = auth.uid() and org_id = app.my_org());
create policy client_update on client_app_state for update
  using (client_id = auth.uid())
  with check (client_id = auth.uid() and org_id = app.my_org());
create policy coach_read on client_app_state for select using (app.is_coach() and org_id = app.my_org());

grant select, insert, update on client_app_state to authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on client_app_state from anon';
  end if;
end $$;
