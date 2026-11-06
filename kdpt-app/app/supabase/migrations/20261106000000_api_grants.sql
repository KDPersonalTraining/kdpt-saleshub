-- Step 3 of the database: let the app's signed-in users reach the tables.
--
-- Newer Supabase projects no longer give the "authenticated" role access to
-- tables in public automatically. Without these grants every read fails with
-- "permission denied", even for a coach whose profile exists. That's safe to
-- grant because every table has row-level security switched on and forced (see
-- the initial schema): the policies decide which rows anyone sees.
-- service_role is the server-only key used to add clients. Safe to run twice.

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant usage on schema public, app to service_role';
    execute 'grant all on all tables in schema public to service_role';
    execute 'grant usage, select on all sequences in schema public to service_role';
    execute 'grant execute on all functions in schema app to service_role';
    execute 'alter default privileges in schema public grant all on tables to service_role';
  end if;
end $$;
